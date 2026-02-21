// ============================================================
// dashboard.js — Donor Dashboard Module
// ============================================================

import { db, collection, getDocs, getDoc, doc, updateDoc, query, where } from './firebase-config.js';

let currentDonorId = null;
let currentDonorData = null;

export function initDashboard() {
    const loginBtn = document.getElementById('dash-login-btn');
    if (!loginBtn) return;

    loginBtn.addEventListener('click', handleDashLogin);

    // Enter key on phone input
    document.getElementById('dash-phone').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleDashLogin();
    });

    // Availability toggle
    document.getElementById('dash-available').addEventListener('change', handleAvailabilityToggle);

    // Edit profile
    document.getElementById('dash-edit-btn').addEventListener('click', showEditForm);
    document.getElementById('edit-cancel-btn').addEventListener('click', hideEditForm);
    document.getElementById('edit-save-btn').addEventListener('click', handleSaveProfile);

    // Logout
    document.getElementById('dash-logout-btn').addEventListener('click', handleLogout);
}

async function handleDashLogin() {
    const phone = document.getElementById('dash-phone').value.trim();

    if (!phone || phone.length < 10) {
        showError('err-dash-phone', 'Enter your registered phone number');
        return;
    }
    clearError('err-dash-phone');

    try {
        // Find donor by phone
        const donorQuery = query(collection(db, 'donors'), where('phone', '==', phone));
        const snapshot = await getDocs(donorQuery);

        if (snapshot.empty) {
            showError('err-dash-phone', 'No donor found with this phone number. Please register first.');
            return;
        }

        // Get first match
        const donorDoc = snapshot.docs[0];
        currentDonorId = donorDoc.id;
        currentDonorData = donorDoc.data();

        // Show dashboard
        renderDashboard(currentDonorData);
        document.getElementById('dash-login').classList.add('hidden');
        document.getElementById('dash-content').classList.remove('hidden');

        window.showToast(`Welcome back, ${currentDonorData.name}!`, 'success');

        // Load matching requests
        loadMatchingRequests(currentDonorData.bloodGroup);

    } catch (err) {
        console.error('Dashboard login error:', err);
        window.showToast('Login failed. Check Firebase setup.', 'error');
    }
}

function renderDashboard(donor) {
    const initial = donor.name ? donor.name.charAt(0).toUpperCase() : '?';

    document.getElementById('dash-avatar').textContent = initial;
    document.getElementById('dash-name').textContent = donor.name;
    document.getElementById('dash-blood').textContent = donor.bloodGroup;
    document.getElementById('dash-p-phone').textContent = donor.phone;
    document.getElementById('dash-p-email').textContent = donor.email || '—';
    document.getElementById('dash-p-location').textContent =
        `${donor.city || '—'}${donor.area ? ', ' + donor.area : ''}`;

    // Set availability toggle
    const availToggle = document.getElementById('dash-available');
    availToggle.checked = donor.available !== false;
    updateAvailText(availToggle.checked);
}

async function handleAvailabilityToggle() {
    if (!currentDonorId) return;

    const isAvailable = document.getElementById('dash-available').checked;
    updateAvailText(isAvailable);

    try {
        await updateDoc(doc(db, 'donors', currentDonorId), {
            available: isAvailable
        });

        currentDonorData.available = isAvailable;
        window.showToast(isAvailable ? '🟢 You are now available' : '🟠 You are now busy', 'success');
    } catch (err) {
        console.error('Availability update error:', err);
        window.showToast('Failed to update availability.', 'error');
    }
}

function updateAvailText(isAvailable) {
    const text = document.getElementById('dash-avail-text');
    text.textContent = isAvailable ? 'Available' : 'Busy';
    text.style.color = isAvailable ? 'var(--green)' : 'var(--orange)';
}

function showEditForm() {
    document.getElementById('dash-edit-form').classList.remove('hidden');

    // Pre-fill form
    document.getElementById('edit-name').value = currentDonorData.name || '';
    document.getElementById('edit-email').value = currentDonorData.email || '';
    document.getElementById('edit-city').value = currentDonorData.city || '';
    document.getElementById('edit-area').value = currentDonorData.area || '';
}

function hideEditForm() {
    document.getElementById('dash-edit-form').classList.add('hidden');
}

async function handleSaveProfile() {
    if (!currentDonorId) return;

    const name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const city = document.getElementById('edit-city').value.trim();
    const area = document.getElementById('edit-area').value.trim();

    if (!name) {
        window.showToast('Name cannot be empty', 'error');
        return;
    }

    try {
        const updates = {
            name,
            email,
            city: city ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() : '',
            area
        };

        await updateDoc(doc(db, 'donors', currentDonorId), updates);

        // Update local data
        Object.assign(currentDonorData, updates);

        // Re-render dashboard
        renderDashboard(currentDonorData);
        hideEditForm();

        window.showToast('✅ Profile updated successfully!', 'success');
    } catch (err) {
        console.error('Profile update error:', err);
        window.showToast('Failed to update profile.', 'error');
    }
}

async function loadMatchingRequests(bloodGroup) {
    const list = document.getElementById('dash-requests');
    const emptyState = document.getElementById('dash-requests-empty');
    if (!list) return;

    try {
        const requestQuery = query(
            collection(db, 'emergency_requests'),
            where('bloodGroup', '==', bloodGroup)
        );
        const snapshot = await getDocs(requestQuery);

        if (snapshot.empty) {
            list.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        list.innerHTML = '';

        snapshot.forEach(docSnap => {
            const request = docSnap.data();
            const item = createRequestItem(request);
            list.appendChild(item);
        });

    } catch (err) {
        console.error('Load matching requests error:', err);
    }
}

function createRequestItem(request) {
    const item = document.createElement('div');
    item.className = 'emergency-item';

    const urgencyLabels = {
        critical: '🔴 Critical',
        urgent: '🟠 Urgent',
        normal: '🟡 Normal'
    };

    const timeStr = request.createdAt?.seconds
        ? new Date(request.createdAt.seconds * 1000).toLocaleString()
        : 'Just now';

    item.innerHTML = `
        <div class="emergency-item-header">
            <h4>🩸 ${escapeHtml(request.patientName)} needs <span class="blood-badge">${escapeHtml(request.bloodGroup)}</span></h4>
            <span class="urgency-badge ${request.urgency}">${urgencyLabels[request.urgency] || request.urgency}</span>
        </div>
        <div class="emergency-item-body">
            <div class="emergency-detail"><strong>🏥</strong> ${escapeHtml(request.hospital)}</div>
            <div class="emergency-detail"><strong>📍</strong> ${escapeHtml(request.city)}</div>
            <div class="emergency-detail"><strong>📞</strong> ${escapeHtml(request.contactNumber)}</div>
            <div class="emergency-detail"><strong>🕐</strong> ${timeStr}</div>
        </div>
        <div class="emergency-item-footer">
            <a href="tel:${escapeHtml(request.contactNumber)}" class="btn btn-call btn-sm">📞 Call</a>
            <a href="https://wa.me/${cleanPhone(request.contactNumber)}?text=${encodeURIComponent('Hi, I am a blood donor registered on BloodLink. I can help with your blood request.')}" target="_blank" class="btn btn-whatsapp btn-sm">💬 WhatsApp</a>
        </div>
    `;

    return item;
}

function handleLogout() {
    currentDonorId = null;
    currentDonorData = null;

    document.getElementById('dash-login').classList.remove('hidden');
    document.getElementById('dash-content').classList.add('hidden');
    document.getElementById('dash-phone').value = '';
    document.getElementById('dash-edit-form').classList.add('hidden');

    window.showToast('Logged out successfully', 'info');
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

function cleanPhone(phone) {
    return phone.replace(/[^0-9+]/g, '');
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
