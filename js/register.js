// ============================================================
// register.js — Donor Registration Module
// ============================================================

import { db, collection, addDoc, serverTimestamp, getDocs, query, where } from './firebase-config.js';

export function initRegister() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', handleRegister);

    // GPS checkbox
    const locationCheckbox = document.getElementById('reg-location');
    locationCheckbox.addEventListener('change', () => {
        if (locationCheckbox.checked) {
            captureLocation();
        }
    });
}

let capturedLat = null;
let capturedLng = null;

function captureLocation() {
    if (!navigator.geolocation) {
        window.showToast('Geolocation is not supported by your browser', 'error');
        document.getElementById('reg-location').checked = false;
        return;
    }

    window.showToast('Capturing your location...', 'info');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            capturedLat = position.coords.latitude;
            capturedLng = position.coords.longitude;
            window.showToast('Location captured successfully!', 'success');
        },
        (error) => {
            window.showToast('Unable to capture location. Please allow GPS access.', 'error');
            document.getElementById('reg-location').checked = false;
            console.warn('Geolocation error:', error);
        }
    );
}

async function handleRegister(e) {
    e.preventDefault();

    // Get form values
    const name = document.getElementById('reg-name').value.trim();
    const bloodGroup = document.getElementById('reg-blood').value;
    const phone = document.getElementById('reg-phone').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const city = document.getElementById('reg-city').value.trim();
    const area = document.getElementById('reg-area').value.trim();

    // Validate
    let valid = true;

    if (!name) {
        showError('err-name', 'Full name is required');
        valid = false;
    } else {
        clearError('err-name');
    }

    if (!bloodGroup) {
        showError('err-blood', 'Please select a blood group');
        valid = false;
    } else {
        clearError('err-blood');
    }

    if (!phone || phone.length < 10) {
        showError('err-phone', 'Valid phone number is required (min 10 digits)');
        valid = false;
    } else {
        clearError('err-phone');
    }

    if (email && !isValidEmail(email)) {
        showError('err-email', 'Please enter a valid email');
        valid = false;
    } else {
        clearError('err-email');
    }

    if (!city) {
        showError('err-city', 'City is required');
        valid = false;
    } else {
        clearError('err-city');
    }

    if (!valid) return;

    // Show loading
    setLoading('reg-submit', true);

    try {
        // Check if phone already registered
        const existingQuery = query(collection(db, 'donors'), where('phone', '==', phone));
        const existingSnap = await getDocs(existingQuery);

        if (!existingSnap.empty) {
            window.showToast('This phone number is already registered!', 'error');
            setLoading('reg-submit', false);
            return;
        }

        // Save to Firestore
        const donorData = {
            name,
            bloodGroup,
            phone,
            email: email || '',
            city: city.charAt(0).toUpperCase() + city.slice(1).toLowerCase(),
            area: area || '',
            lat: capturedLat,
            lng: capturedLng,
            available: true,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'donors'), donorData);

        window.showToast('🎉 Registration successful! You are now a donor.', 'success');

        // Reset form
        document.getElementById('register-form').reset();
        capturedLat = null;
        capturedLng = null;

        // Update stats
        const { updateStats } = await import('./app.js');
        updateStats();

    } catch (err) {
        console.error('Registration error:', err);
        window.showToast('Registration failed. Please check your Firebase setup.', 'error');
    }

    setLoading('reg-submit', false);
}

// ---------- Helpers ----------
function showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
}

function clearError(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (loading) {
        btn.disabled = true;
        if (text) text.classList.add('hidden');
        if (loader) loader.classList.remove('hidden');
    } else {
        btn.disabled = false;
        if (text) text.classList.remove('hidden');
        if (loader) loader.classList.add('hidden');
    }
}
