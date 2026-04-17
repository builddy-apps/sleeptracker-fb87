// Shared State
const appState = {
    settings: { sleepGoal: 480 },
    async loadSettings() {
        try {
            const res = await apiGet('/api/settings');
            if (res.success && res.data) {
                res.data.forEach(s => {
                    try {
                        this.settings[s.key] = JSON.parse(s.value);
                    } catch { this.settings[s.key] = s.value; }
                });
            }
        } catch (e) { console.error('Failed to load settings'); }
    }
};

// Dark Mode
function initDarkMode() {
    const saved = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'true' || (!saved && prefersDark)) {
        document.documentElement.classList.add('dark');
    }
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
}

// API Helpers
async function apiGet(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        showToast(err.message, 'error');
        throw err;
    }
}

async function apiPost(url, data) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        showToast('Request failed', 'error');
        throw err;
    }
}

async function apiPut(url, data) {
    try {
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        showToast('Update failed', 'error');
        throw err;
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-msg');
    const icon = toast.querySelector('svg');
    
    msg.textContent = message;
    toast.classList.remove('hidden');
    
    if (type === 'error') {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>';
        icon.classList.replace('text-emerald-400', 'text-red-400');
        icon.classList.replace('dark:text-emerald-600', 'dark:text-red-600');
    } else {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
        icon.classList.replace('text-red-400', 'text-emerald-400');
        icon.classList.replace('dark:text-red-600', 'dark:text-emerald-600');
    }
    
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Navigation Controller
let currentPage = null;

async function navigateTo(pageName) {
    if (currentPage === pageName) return;
    const main = document.getElementById('main-content');
    const fileName = pageName === 'log' ? 'log-sleep' : pageName;
    
    main.classList.remove('animate-fade-in');
    main.innerHTML = '<div class="flex justify-center py-12"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>';
    
    try {
        const res = await fetch(`/${fileName}.html`);
        if (!res.ok) throw new Error('Page not found');
        
        main.innerHTML = await res.text();
        main.classList.add('animate-fade-in');
        
        const script = document.createElement('script');
        script.src = `/${fileName}.js`;
        main.appendChild(script);
        
        currentPage = pageName;
        if (typeof updateNavActive === 'function') updateNavActive(pageName);
        
    } catch (err) {
        main.innerHTML = `<div class="text-center text-red-500 py-12">Failed to load ${pageName}</div>`;
    }
}

// Date Helpers
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMinutes(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
}

function calculateDuration(bedtime, wakeTime) {
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = wakeTime.split(':').map(Number);
    let diff = (wh * 60 + wm) - (bh * 60 + bm);
    return diff <= 0 ? diff + 1440 : diff;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.appState = appState;