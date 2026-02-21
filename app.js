// ============================================================
// app.js — SPA Router, Toast System, Global Logic
// ============================================================

import { db, collection, getDocs } from './firebase-config.js';
import { initRegister } from './register.js';
import { initSearch } from './search.js';
import { initEmergency } from './emergency.js';
import { initDashboard } from './dashboard.js';
import { initContact } from './contact.js';

// ---------- SPA Router ----------
const pages = ['home', 'register', 'search', 'emergency', 'dashboard'];

function navigateTo(page) {
    if (!pages.includes(page)) page = 'home';

    // Hide all pages, show target
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });

    // Close mobile menu
    document.getElementById('nav-menu').classList.remove('open');
    document.getElementById('nav-toggle').classList.remove('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update hash without scroll
    history.replaceState(null, '', `#${page}`);
}

// Listen for hash changes
window.addEventListener('hashchange', () => {
    const page = location.hash.replace('#', '') || 'home';
    navigateTo(page);
});

// Nav link clicks
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

// All [data-navigate] elements
document.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(el.dataset.navigate);
    });
});

// Mobile toggle
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('open');
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 30);
});

// ---------- Toast Notifications ----------
window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 3200);
};

// ---------- Stats Counter (Home Page) ----------
async function updateStats() {
    try {
        const donorsSnap = await getDocs(collection(db, 'donors'));
        const requestsSnap = await getDocs(collection(db, 'emergency_requests'));

        const donorCount = donorsSnap.size;
        const requestCount = requestsSnap.size;

        // Count unique cities
        const cities = new Set();
        donorsSnap.forEach(doc => {
            const city = doc.data().city;
            if (city) cities.add(city.toLowerCase().trim());
        });

        animateCounter('stat-donors', donorCount);
        animateCounter('stat-requests', requestCount);
        animateCounter('stat-cities', cities.size);
    } catch (err) {
        console.warn('Stats fetch failed (Firebase may not be configured):', err.message);
    }
}

function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let current = 0;
    const duration = 1500;
    const step = target / (duration / 16);

    function tick() {
        current += step;
        if (current >= target) {
            el.textContent = target;
            return;
        }
        el.textContent = Math.floor(current);
        requestAnimationFrame(tick);
    }
    tick();
}

// ---------- Initialize All Modules ----------
document.addEventListener('DOMContentLoaded', () => {
    // Navigate based on initial hash
    const initialPage = location.hash.replace('#', '') || 'home';
    navigateTo(initialPage);

    // Init modules
    initRegister();
    initSearch();
    initEmergency();
    initDashboard();
    initContact();

    // Load stats
    updateStats();
});

// Export for other modules
export { navigateTo, updateStats };
