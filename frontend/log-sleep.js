// ClockPicker Class
class ClockPicker {
    constructor(canvasId, onConfirm, initialTime = '00:00', isPM = false) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.onConfirm = onConfirm;
        this.hour = parseInt(initialTime.split(':')[0], 10);
        this.minute = parseInt(initialTime.split(':')[1], 10);
        this.isPM = isPM;
        this.isDragging = false;
        this.dragTarget = null; // 'hour' or 'minute'
        this.snapMinutes = true;
        
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 20;
        
        this.initEvents();
        this.render();
    }
    
    initEvents() {
        const handleStart = (e) => {
            e.preventDefault();
            const pos = this.getPosition(e);
            const angle = this.getAngle(pos.x, pos.y);
            
            // Determine which hand is closer to touch point
            const hourAngle = (this.hour % 12) * 30 + (this.minute / 60) * 30;
            const minuteAngle = this.minute * 6;
            
            const distToHour = this.angleDiff(angle, hourAngle);
            const distToMinute = this.angleDiff(angle, minuteAngle);
            
            if (distToMinute < 15) {
                this.dragTarget = 'minute';
            } else {
                this.dragTarget = 'hour';
            }
            
            this.isDragging = true;
            this.updateFromAngle(angle);
        };
        
        const handleMove = (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
            const pos = this.getPosition(e);
            const angle = this.getAngle(pos.x, pos.y);
            this.updateFromAngle(angle);
        };
        
        const handleEnd = () => {
            this.isDragging = false;
            this.dragTarget = null;
        };
        
        this.canvas.addEventListener('mousedown', handleStart);
        this.canvas.addEventListener('mousemove', handleMove);
        this.canvas.addEventListener('mouseup', handleEnd);
        this.canvas.addEventListener('mouseleave', handleEnd);
        
        this.canvas.addEventListener('touchstart', handleStart);
        this.canvas.addEventListener('touchmove', handleMove);
        this.canvas.addEventListener('touchend', handleEnd);
    }
    
    getPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left - this.centerX,
            y: clientY - rect.top - this.centerY
        };
    }
    
    getAngle(x, y) {
        let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;
        return angle;
    }
    
    angleDiff(a1, a2) {
        let diff = Math.abs(a1 - a2);
        if (diff > 180) diff = 360 - diff;
        return diff;
    }
    
    updateFromAngle(angle) {
        if (this.dragTarget === 'minute') {
            this.minute = Math.round(angle / 6);
            if (this.minute === 60) this.minute = 0;
            if (this.snapMinutes) {
                this.minute = Math.round(this.minute / 5) * 5;
            }
        } else {
            let hour = Math.round(angle / 30);
            if (hour === 0) hour = 12;
            if (hour === 12 && this.minute > 30) hour = 1;
            this.hour = hour;
        }
        this.render();
    }
    
    setHour(h) {
        this.hour = h;
        this.render();
    }
    
    setMinute(m) {
        this.minute = m;
        this.render();
    }
    
    setPM(val) {
        this.isPM = val;
        this.render();
    }
    
    getTimeString() {
        const displayHour = this.hour === 0 ? 12 : (this.hour > 12 ? this.hour - 12 : this.hour);
        const h = displayHour.toString().padStart(2, '0');
        const m = this.minute.toString().padStart(2, '0');
        const hour24 = this.isPM && this.hour !== 12 ? this.hour + 12 : (!this.isPM && this.hour === 12 ? 0 : this.hour);
        return {
            display: `${h}:${m} ${this.isPM ? 'PM' : 'AM'}`,
            value: `${hour24.toString().padStart(2, '0')}:${m}`
        };
    }
    
    render() {
        const ctx = this.ctx;
        const cx = this.centerX;
        const cy = this.centerY;
        const r = this.radius;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Gradient background
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        const isDark = document.documentElement.classList.contains('dark');
        gradient.addColorStop(0, isDark ? '#1e293b' : '#f8fafc');
        gradient.addColorStop(1, isDark ? '#0f172a' : '#e2e8f0');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw hour markers
        for (let i = 0; i < 60; i++) {
            const angle = (i * 6 - 90) * Math.PI / 180;
            const isHour = i % 5 === 0;
            const innerR = isHour ? r - 15 : r - 8;
            const outerR = r - 2;
            
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
            ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
            ctx.strokeStyle = isHour ? (isDark ? '#818cf8' : '#4f46e5') : (isDark ? '#475569' : '#94a3b8');
            ctx.lineWidth = isHour ? 3 : 1;
            ctx.stroke();
        }
        
        // Draw hour hand
        const hourAngle = ((this.hour % 12) * 30 + (this.minute / 60) * 30 - 90) * Math.PI / 180;
        this.drawHand(cx, cy, hourAngle, r * 0.5, 6, '#6366f1');
        
        // Draw minute hand
        const minuteAngle = (this.minute * 6 - 90) * Math.PI / 180;
        this.drawHand(cx, cy, minuteAngle, r * 0.7, 4, '#06b6d4');
        
        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
        ctx.fill();
    }
    
    drawHand(cx, cy, angle, length, width, color) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

// Form Controller
let currentPicker = null;
let currentMode = null; // 'bedtime' or 'wake'

function initSleepForm() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    document.getElementById('date-input').value = yesterday.toISOString().split('T')[0];
    
    // Bedtime button
    document.getElementById('bedtime-btn').addEventListener('click', () => {
        currentMode = 'bedtime';
        const existing = document.getElementById('bedtime-input').value;
        openClockPicker(existing || '22:00');
    });
    
    // Wake button
    document.getElementById('wake-btn').addEventListener('click', () => {
        currentMode = 'wake';
        const existing = document.getElementById('wake-input').value;
        openClockPicker(existing || '07:00');
    });
    
    // AM/PM buttons
    document.getElementById('am-btn').addEventListener('click', () => {
        if (currentPicker) currentPicker.setPM(false);
        updateAMPMButtons();
    });
    
    document.getElementById('pm-btn').addEventListener('click', () => {
        if (currentPicker) currentPicker.setPM(true);
        updateAMPMButtons();
    });
    
    // Confirm button
    document.getElementById('confirm-time-btn').addEventListener('click', () => {
        if (currentPicker) {
            const time = currentPicker.getTimeString();
            if (currentMode === 'bedtime') {
                document.getElementById('bedtime-display').textContent = time.display;
                document.getElementById('bedtime-input').value = time.value;
            } else {
                document.getElementById('wake-display').textContent = time.display;
                document.getElementById('wake-input').value = time.value;
            }
            calculateDuration();
        }
        closeClockModal();
    });
    
    // Form submission
    document.getElementById('sleep-form').addEventListener('submit', handleFormSubmit);
    
    // Date change - check for existing entry
    document.getElementById('date-input').addEventListener('change', handleDateChange);
    
    // Initial check
    handleDateChange();
}

function openClockPicker(timeValue) {
    const modal = document.getElementById('clock-modal');
    modal.classList.remove('hidden');
    
    let hour = parseInt(timeValue.split(':')[0], 10);
    let minute = parseInt(timeValue.split(':')[1], 10);
    const isPM = hour >= 12;
    
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    currentPicker = new ClockPicker('clock-canvas', null, timeStr, isPM);
    updateAMPMButtons();
}

function updateAMPMButtons() {
    const amBtn = document.getElementById('am-btn');
    const pmBtn = document.getElementById('pm-btn');
    
    if (!currentPicker) return;
    
    const isDark = document.documentElement.classList.contains('dark');
    
    if (currentPicker.isPM) {
        amBtn.className = 'px-6 py-2 rounded-xl font-medium transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-night-800';
        pmBtn.className = 'px-6 py-2 rounded-xl font-medium transition-all bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-300';
    } else {
        amBtn.className = 'px-6 py-2 rounded-xl font-medium transition-all bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-300';
        pmBtn.className = 'px-6 py-2 rounded-xl font-medium transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-night-800';
    }
}

function closeClockModal() {
    const modal = document.getElementById('clock-modal');
    modal.classList.add('hidden');
    currentPicker = null;
    currentMode = null;
}

function calculateDuration() {
    const bedtime = document.getElementById('bedtime-input').value;
    const wakeTime = document.getElementById('wake-input').value;
    
    if (!bedtime || !wakeTime) {
        document.getElementById('duration-display').textContent = '--';
        return;
    }
    
    const duration = calculateDurationMinutes(bedtime, wakeTime);
    document.getElementById('duration-display').textContent = formatMinutes(duration);
}

function calculateDurationMinutes(bedtime, wakeTime) {
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = wakeTime.split(':').map(Number);
    let diff = (wh * 60 + wm) - (bh * 60 + bm);
    return diff <= 0 ? diff + 1440 : diff;
}

function formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const hour = h === 0 ? 12 : (h > 12 ? h - 12 : h);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatMinutes(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
}

async function handleDateChange() {
    const date = document.getElementById('date-input').value;
    if (!date) return;
    
    try {
        const res = await apiGet(`/api/sleep-logs?days=30`);
        if (res.success && res.data) {
            const existing = res.data.find(log => log.date === date);
            if (existing) {
                document.getElementById('bedtime-display').textContent = formatTime(existing.bedtime);
                document.getElementById('bedtime-input').value = existing.bedtime;
                document.getElementById('wake-display').textContent = formatTime(existing.wake_time);
                document.getElementById('wake-input').value = existing.wake_time;
                document.getElementById('notes-input').value = existing.notes || '';
                calculateDuration();
            } else {
                clearForm();
            }
        }
    } catch (err) {
        console.error('Failed to check existing entry:', err);
    }
}

function clearForm() {
    document.getElementById('bedtime-display').textContent = '--:--';
    document.getElementById('bedtime-input').value = '';
    document.getElementById('wake-display').textContent = '--:--';
    document.getElementById('wake-input').value = '';
    document.getElementById('notes-input').value = '';
    document.getElementById('duration-display').textContent = '--';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const date = document.getElementById('date-input').value;
    const bedtime = document.getElementById('bedtime-input').value;
    const wakeTime = document.getElementById('wake-input').value;
    const notes = document.getElementById('notes-input').value;
    
    // Validation
    if (!date) {
        showToast('Please select a date', 'error');
        return;
    }
    if (!bedtime) {
        showToast('Please select bedtime', 'error');
        return;
    }
    if (!wakeTime) {
        showToast('Please select wake-up time', 'error');
        return;
    }
    
    const duration = calculateDurationMinutes(bedtime, wakeTime);
    if (duration < 60) {
        showToast('Sleep duration seems too short. Please check your times.', 'error');
        return;
    }
    if (duration > 24 * 60) {
        showToast('Sleep duration seems too long. Please check your times.', 'error');
        return;
    }
    
    try {
        const res = await apiPost('/api/sleep-logs', {
            date,
            bedtime,
            wake_time: wakeTime,
            notes
        });
        
        if (res.success) {
            showToast('Sleep log saved successfully!');
        }
    } catch (err) {
        console.error('Failed to save sleep log:', err);
        showToast('Failed to save sleep log', 'error');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initSleepForm);