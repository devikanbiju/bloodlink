// ============================================================
// emergency.js — Emergency Alert Module
// ============================================================

import { db, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc, doc } from './firebase-config.js';

export function initEmergency() {
    const form = document.getElementById('emergency-form');
    if (!form) return;

    form.addEventListener('submit', handleEmergencySubmit);

    // Load active requests
    loadEmergencyRequests();
}

async function handleEmergencySubmit(e) {
    e.preventDefault();

    // Get values
    const patientName = document.getElementById('em-patient').value.trim();
    const bloodGroup = document.getElementById('em-blood').value;
    const hospital = document.getElementById('em-hospital').value.trim();
    const city = document.getElementById('em-city').value.trim();
    const contactNumber = document.getElementById('em-contact').value.trim();
    const urgency = document.getElementById('em-urgency').value;
    const notes = document.getElementById('em-notes').value.trim();

    // Validate
    let valid = true;

    if (!patientName) {
        showError('err-patient', 'Patient name is required');
        valid = false;
    } else { clearError('err-patient'); }

    if (!bloodGroup) {
        showError('err-em-blood', 'Please select blood group');
        valid = false;
    } else { clearError('err-em-blood'); }

    if (!hospital) {
        showError('err-hospital', 'Hospital name is required');
        valid = false;
    } else { clearError('err-hospital'); }

    if (!city) {
        showError('err-em-city', 'City is required');
        valid = false;
    } else { clearError('err-em-city'); }

    if (!contactNumber || contactNumber.length < 10) {
        showError('err-contact', 'Valid contact number is required');
        valid = false;
    } else { clearError('err-contact'); }

    if (!valid) return;

    // Show loading
    setLoading('em-submit', true);

    try {
        // Count matching donors
        const matchQuery = query(
            collection(db, 'donors'),
            where('bloodGroup', '==', bloodGroup),
            where('available', '==', true)
        );
        const matchSnap = await getDocs(matchQuery);
        const matchCount = matchSnap.size;

        // Save emergency request
        const requestData = {
            patientName,
            bloodGroup,
            hospital,
            city: city.charAt(0).toUpperCase() + city.slice(1).toLowerCase(),
            contactNumber,
            urgency,
            notes: notes || '',
            status: 'active',
            matchingDonors: matchCount,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'emergency_requests'), requestData);

        if (matchCount > 0) {
            window.showToast(`🚨 Emergency request sent! ${matchCount} matching donor(s) found.`, 'success');
        } else {
            window.showToast('⚠️ Emergency request created. No matching donors currently available.', 'info');
        }

        // Reset form
        document.getElementById('emergency-form').reset();

        // Reload requests list
        loadEmergencyRequests();

        // Update stats
        const { updateStats } = await import('./app.js');
        updateStats();

    } catch (err) {
        console.error('Emergency request error:', err);
        window.showToast('Failed to send emergency request. Check Firebase setup.', 'error');
    }

    setLoading('em-submit', false);
}

async function loadEmergencyRequests() {
    const list = document.getElementById('emergency-list');
    const emptyState = document.getElementById('emergency-empty');
    if (!list) return;

    try {
        const requestsRef = collection(db, 'emergency_requests');
        const snapshot = await getDocs(requestsRef);

        if (snapshot.empty) {
            list.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        list.innerHTML = '';

        // Sort by createdAt (descending) — client-side since orderBy may need an index
        const requests = [];
        snapshot.forEach(docSnap => {
            requests.push({ id: docSnap.id, ...docSnap.data() });
        });

        requests.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });

        requests.forEach((request) => {
            const item = createEmergencyItem(request);
            list.appendChild(item);
        });

    } catch (err) {
        console.error('Load emergency requests error:', err);
    }
}

function createEmergencyItem(request) {
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
            <div class="emergency-detail"><strong>🏥 Hospital:</strong> ${escapeHtml(request.hospital)}</div>
            <div class="emergency-detail"><strong>📍 City:</strong> ${escapeHtml(request.city)}</div>
            <div class="emergency-detail"><strong>📞 Contact:</strong> ${escapeHtml(request.contactNumber)}</div>
            <div class="emergency-detail"><strong>🕐 Posted:</strong> ${timeStr}</div>
            ${request.notes ? `<div class="emergency-detail" style="grid-column:1/-1"><strong>📝 Notes:</strong> ${escapeHtml(request.notes)}</div>` : ''}
            <div class="emergency-detail"><strong>👥 Matching Donors:</strong> ${request.matchingDonors || 0}</div>
        </div>
        <div class="emergency-item-footer">
            <a href="tel:${escapeHtml(request.contactNumber)}" class="btn btn-call btn-sm">📞 Call</a>
            <a href="https://wa.me/${cleanPhone(request.contactNumber)}?text=${encodeURIComponent('Hi, I saw your emergency blood request on BloodLink. I would like to help!')}" target="_blank" class="btn btn-whatsapp btn-sm">💬 WhatsApp</a>
            <button class="btn btn-outline btn-sm resolve-btn" data-id="${request.id}">✅ Resolved</button>
        </div>
    `;

    // Resolve button
    item.querySelector('.resolve-btn').addEventListener('click', async () => {
        try {
            await deleteDoc(doc(db, 'emergency_requests', request.id));
            window.showToast('Request marked as resolved!', 'success');
            loadEmergencyRequests();
        } catch (err) {
            console.error('Delete error:', err);
            window.showToast('Failed to resolve request.', 'error');
        }
    });

    return item;
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

function cleanPhone(phone) {
    return phone.replace(/[^0-9+]/g, '');
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export { loadEmergencyRequests };
