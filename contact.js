// ============================================================
// contact.js — Contact/Communication Module
// ============================================================

export function initContact() {
    // Close modal
    document.getElementById('modal-close').addEventListener('click', closeContactModal);

    // Click outside modal to close
    document.getElementById('contact-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeContactModal();
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeContactModal();
    });

    // Copy number button
    document.getElementById('modal-copy-btn').addEventListener('click', handleCopyNumber);
}

let currentContactPhone = '';

export function openContactModal(donor) {
    const modal = document.getElementById('contact-modal');
    if (!modal) return;

    const initial = donor.name ? donor.name.charAt(0).toUpperCase() : '?';
    const isAvailable = donor.available !== false;

    document.getElementById('modal-avatar').textContent = initial;
    document.getElementById('modal-name').textContent = donor.name || 'Unknown';
    document.getElementById('modal-blood').textContent = donor.bloodGroup || '?';
    document.getElementById('modal-location').textContent =
        `${donor.city || '—'}${donor.area ? ', ' + donor.area : ''}`;
    document.getElementById('modal-email').textContent = donor.email || '—';
    document.getElementById('modal-phone').textContent = donor.phone || '—';
    document.getElementById('modal-status').textContent = isAvailable ? '🟢 Available' : '🟠 Busy';
    document.getElementById('modal-status').style.color = isAvailable ? 'var(--green)' : 'var(--orange)';

    // Set action links
    const cleanedPhone = (donor.phone || '').replace(/[^0-9+]/g, '');
    currentContactPhone = donor.phone || '';

    document.getElementById('modal-call-btn').href = `tel:${cleanedPhone}`;
    document.getElementById('modal-whatsapp-btn').href =
        `https://wa.me/${cleanedPhone}?text=${encodeURIComponent('Hi, I found your profile on BloodLink. I need blood donation help. Can you please assist?')}`;

    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeContactModal() {
    const modal = document.getElementById('contact-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

async function handleCopyNumber() {
    if (!currentContactPhone) return;

    try {
        await navigator.clipboard.writeText(currentContactPhone);
        window.showToast('📋 Phone number copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = currentContactPhone;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        window.showToast('📋 Phone number copied!', 'success');
    }
}
