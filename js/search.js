// ============================================================
// search.js — Search Donors Module
// ============================================================

import { db, collection, getDocs, query, where } from './firebase-config.js';
import { openContactModal } from './contact.js';

export function initSearch() {
    const searchBtn = document.getElementById('search-btn');
    if (!searchBtn) return;

    searchBtn.addEventListener('click', handleSearch);

    // Also search on Enter key
    document.getElementById('search-city').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

async function handleSearch() {
    const bloodGroup = document.getElementById('search-blood').value;
    const city = document.getElementById('search-city').value.trim();

    const grid = document.getElementById('donors-grid');
    const resultsInfo = document.getElementById('results-info');
    const emptyState = document.getElementById('search-empty');

    // Show loading state
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>Searching donors...</p></div>';
    resultsInfo.classList.add('hidden');
    emptyState.classList.add('hidden');

    try {
        // Build query
        let donorQuery;
        const donorsRef = collection(db, 'donors');

        if (bloodGroup && city) {
            const normalizedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
            donorQuery = query(donorsRef,
                where('bloodGroup', '==', bloodGroup),
                where('city', '==', normalizedCity)
            );
        } else if (bloodGroup) {
            donorQuery = query(donorsRef, where('bloodGroup', '==', bloodGroup));
        } else if (city) {
            const normalizedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
            donorQuery = query(donorsRef, where('city', '==', normalizedCity));
        } else {
            donorQuery = query(donorsRef);
        }

        const snapshot = await getDocs(donorQuery);

        if (snapshot.empty) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
            resultsInfo.classList.add('hidden');
            return;
        }

        // Render results
        grid.innerHTML = '';
        let count = 0;

        snapshot.forEach((doc) => {
            const donor = doc.data();
            count++;
            const card = createDonorCard(doc.id, donor, count);
            grid.appendChild(card);
        });

        // Update results info
        document.getElementById('results-count').textContent = count;
        resultsInfo.classList.remove('hidden');
        emptyState.classList.add('hidden');

    } catch (err) {
        console.error('Search error:', err);
        grid.innerHTML = '';
        window.showToast('Search failed. Please check Firebase setup.', 'error');
    }
}

function createDonorCard(id, donor, index) {
    const card = document.createElement('div');
    card.className = 'donor-card';
    card.style.animationDelay = `${(index - 1) * 0.05}s`;

    const initial = donor.name ? donor.name.charAt(0).toUpperCase() : '?';
    const isAvailable = donor.available !== false;
    const availClass = isAvailable ? 'available' : 'busy';
    const availText = isAvailable ? '🟢 Available' : '🟠 Busy';

    card.innerHTML = `
        <div class="donor-card-header">
            <div class="donor-avatar">${initial}</div>
            <h4>${escapeHtml(donor.name)}</h4>
            <span class="blood-badge">${escapeHtml(donor.bloodGroup)}</span>
        </div>
        <div class="donor-card-body">
            <div class="donor-detail">📍 ${escapeHtml(donor.city || '—')}${donor.area ? ', ' + escapeHtml(donor.area) : ''}</div>
            <div class="donor-detail">
                <span class="availability-badge ${availClass}">${availText}</span>
            </div>
        </div>
        <div class="donor-card-footer">
            <button class="btn btn-primary btn-sm contact-donor-btn" data-donor-id="${id}">📞 Contact</button>
        </div>
    `;

    // Attach contact click
    card.querySelector('.contact-donor-btn').addEventListener('click', () => {
        openContactModal(donor);
    });

    return card;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
