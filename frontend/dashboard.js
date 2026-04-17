// Dashboard state
let dashboardData = {
    stats: null,
    logs: [],
    settings: { sleepGoal: 480 }
};

// Initialize dashboard
async function initDashboard() {
    showLoading(true);
    try {
        await Promise.all([
            fetchStats(),
            fetchSettings(),
            fetchRecentLogs()
        ]);
        renderDashboard();
    } catch (err) {
        console.error('Failed to load dashboard:', err);
        showToast('Failed to load dashboard data', 'error');
    } finally {
        showLoading(false);
    }
}

// Fetch statistics from API
async function fetchStats() {
    const res = await apiGet('/api/stats');
    if (res.success) {
        dashboardData.stats = res.data;
    }
}

// Fetch settings
async function fetchSettings() {
    await appState.loadSettings();
    dashboardData.settings = appState.settings;
}

// Fetch recent logs (last 7 days for sparkline)
async function fetchRecentLogs() {
    const res = await apiGet('/api/sleep-logs?days=7');
    if (res.success) {
        dashboardData.logs = res.data;
    }
}

// Render all dashboard components
function renderDashboard() {
    const content = document.getElementById('dashboard-content');
    const emptyState = document.getElementById('empty-state');
    
    if (!dashboardData.logs || dashboardData.logs.length === 0) {
        content.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    content.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    const lastLog = dashboardData.logs[dashboardData.logs.length - 1];
    const goal = dashboardData.settings.sleepGoal || 480;
    
    // Render last night's sleep
    if (lastLog) {
        document.getElementById('sleep-duration').textContent = formatMinutes(lastLog.duration_minutes);
        document.getElementById('bedtime-display').textContent = formatTime(lastLog.bedtime);
        document.getElementById('waketime-display').textContent = formatTime(lastLog.wake_time);
        
        // Goal comparison
        const diff = lastLog.duration_minutes - goal;
        const diffText = diff >= 0 
            ? `<span class="text-emerald-600 dark:text-emerald-400">${formatMinutes(diff)} over goal</span>`
            : `<span class="text-orange-500 dark:text-orange-400">${formatMinutes(-diff)} under goal</span>`;
        document.getElementById('goal-comparison').innerHTML = diffText;
        
        // Progress ring
        const percentage = Math.min(100, Math.round((lastLog.duration_minutes / goal) * 100));
        renderProgressRing(percentage);
    }
    
    // Render stats cards
    renderStatsCards(dashboardData.stats);
    
    // Render streak
    renderStreak(dashboardData.stats?.current_streak || 0, dashboardData.stats?.best_streak || 0);
    
    // Render sleep debt
    renderSleepDebt(dashboardData.stats?.sleep_debt || 0);
    
    // Render sparkline
    renderSparkline(dashboardData.logs);
}

// Render progress ring with animation
function renderProgressRing(percentage) {
    const ring = document.getElementById('progress-ring');
    const percentText = document.getElementById('progress-percent');
    const circumference = 2 * Math.PI * 54; // r = 54
    
    ring.style.strokeDasharray = circumference;
    const offset = circumference - (percentage / 100) * circumference;
    ring.style.strokeDashoffset = circumference; // Start at 0
    
    // Animate
    setTimeout(() => {
        ring.style.strokeDashoffset = offset;
    }, 100);
    
    // Animate percentage text
    let current = 0;
    const increment = Math.ceil(percentage / 20);
    const interval = setInterval(() => {
        current = Math.min(current + increment, percentage);
        percentText.textContent = `${current}%`;
        if (current >= percentage) clearInterval(interval);
    }, 40);
}

// Render stats cards
function renderStatsCards(data) {
    document.getElementById('weekly-avg').textContent = data?.weekly_average ? formatMinutes(data.weekly_average) : '--';
    document.getElementById('monthly-avg').textContent = data?.monthly_average ? formatMinutes(data.monthly_average) : '--';
    
    const bestDayEl = document.getElementById('best-day');
    if (data?.best_day?.date) {
        bestDayEl.textContent = `${formatDate(data.best_day.date)} · ${formatMinutes(data.best_day.duration)}`;
    } else {
        bestDayEl.textContent = '--';
    }
    
    const worstDayEl = document.getElementById('worst-day');
    if (data?.worst_day?.date) {
        worstDayEl.textContent = `${formatDate(data.worst_day.date)} · ${formatMinutes(data.worst_day.duration)}`;
    } else {
        worstDayEl.textContent = '--';
    }
}

// Render streak with fire animation
function renderStreak(count, best) {
    document.getElementById('current-streak').textContent = `${count} day${count !== 1 ? 's' : ''}`;
    document.getElementById('best-streak').textContent = `${best} day${best !== 1 ? 's' : ''}`;
}

// Render sleep debt/surplus bar
function renderSleepDebt(minutes) {
    const bar = document.getElementById('debt-bar');
    const label = document.getElementById('debt-label');
    
    const absMinutes = Math.abs(minutes);
    const isDebt = minutes < 0;
    const maxRange = 480; // 8 hours max range for visualization
    
    let width = Math.min(100, (absMinutes / maxRange) * 100);
    
    if (absMinutes === 0) {
        bar.style.width = '50%';
        bar.className = 'h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 to-emerald-500';
        label.textContent = 'On track with your sleep goal';
        return;
    }
    
    if (isDebt) {
        bar.style.width = `${width}%`;
        bar.style.marginLeft = '0';
        bar.className = 'h-full rounded-full transition-all duration-500 bg-gradient-to-r from-red-400 to-red-500';
        label.innerHTML = `<span class="text-red-500 dark:text-red-400 font-medium">${formatMinutes(absMinutes)} sleep debt</span>`;
    } else {
        bar.style.width = `${width}%`;
        bar.style.marginLeft = 'auto';
        bar.style.marginRight = '0';
        bar.className = 'h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 to-emerald-500';
        label.innerHTML = `<span class="text-emerald-600 dark:text-emerald-400 font-medium">${formatMinutes(absMinutes)} sleep surplus</span>`;
    }
}

// Render 7-day sparkline
function renderSparkline(logs) {
    const canvas = document.getElementById('sparkline');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = 160;
    ctx.scale(2, 2);
    
    const width = rect.width;
    const height = 80;
    const padding = 10;
    
    ctx.clearRect(0, 0, width, height);
    
    // Fill last 7 days with zeros if missing
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const log = logs.find(l => l.date === dateStr);
        last7Days.push({
            date: dateStr,
            duration: log ? log.duration_minutes : 0
        });
    }
    
    const maxDuration = Math.max(...last7Days.map(d => d.duration), 480);
    
    // Calculate points
    const points = last7Days.map((d, i) => {
        const x = padding + (i * (width - 2 * padding) / 6);
        const y = height - padding - (d.duration / maxDuration) * (height - 2 * padding);
        return { x, y, duration: d.duration, date: d.date };
    });
    
    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.3)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i - 1].x) / 2;
        const yc = (points[i].y + points[i - 1].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Draw points
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#4f46e5';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

// Helper: Format time (HH:MM -> HH:MM AM/PM)
function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Helper: Format minutes to Xh Ym
function formatMinutes(mins) {
    if (!mins) return '--';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
}

// Helper: Format date
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Toggle loading state
function showLoading(show) {
    const loading = document.getElementById('loading-state');
    const content = document.getElementById('dashboard-content');
    const empty = document.getElementById('empty-state');
    
    if (show) {
        loading.classList.remove('hidden');
        content.classList.add('hidden');
        empty.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// Auto-refresh on visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        initDashboard();
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initDashboard);