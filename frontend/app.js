// Dark Mode Management
function initDarkMode() {
  const stored = localStorage.getItem('darkMode');
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (stored === 'true' || (stored === null && system)) {
    document.documentElement.classList.add('dark');
  }
}

function toggleDark() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
}

// API Helper Class
class API {
  static async fetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || err.message || 'Request failed');
      }
      
      return await res.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw err;
    }
  }
  
  static async get(url) { return this.fetch(url); }
  
  static async post(url, data) {
    return this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  static async del(url) {
    return this.fetch(url, { method: 'DELETE' });
  }
}

// Toast Notification System
const Toast = {
  container: null,
  
  init() {
    this.container = document.createElement('div');
    this.container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(this.container);
  },
  
  show(message, type = 'info', duration = 3000) {
    if (!this.container) this.init();
    
    const colors = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      info: 'bg-slate-800 dark:bg-slate-700 text-white'
    };
    
    const toast = document.createElement('div');
    toast.className = `${colors[type]} px-4 py-3 rounded-lg shadow-lg text-sm font-medium transform transition-all duration-300 translate-x-full`;
    toast.textContent = message;
    
    this.container.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-full');
    });
    
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  success(msg, dur) { this.show(msg, 'success', dur); },
  error(msg, dur) { this.show(msg, 'error', dur); },
  info(msg, dur) { this.show(msg, 'info', dur); }
};

// Page Transition Helper
async function navigateTo(url) {
  document.body.classList.add('opacity-0', 'transition-opacity', 'duration-200');
  await new Promise(r => setTimeout(r, 200));
  window.location.href = url;
}

function fadeIn() {
  document.body.classList.remove('opacity-0');
  document.body.classList.add('transition-opacity', 'duration-300');
}

// Shared State
const State = {
  currentAesthetic: null,
  history: [],
  
  setAesthetic(aesthetic) {
    this.history.push(this.currentAesthetic);
    this.currentAesthetic = aesthetic;
  },
  
  undo() {
    if (this.history.length > 0) {
      this.currentAesthetic = this.history.pop();
      return this.currentAesthetic;
    }
    return null;
  }
};

// Randomize Function
async function randomizeAesthetic() {
  try {
    const res = await API.post('/api/aesthetics/randomize');
    if (res.success) {
      State.setAesthetic(res.data);
      return res.data;
    }
  } catch (err) {
    Toast.error('Failed to randomize: ' + err.message);
  }
  return null;
}

// Initialize on load
initDarkMode();
fadeIn();