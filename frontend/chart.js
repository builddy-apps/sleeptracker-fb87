class SleepChart {
    constructor() {
        this.canvas = document.getElementById('chart-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tooltip = document.getElementById('tooltip');
        this.tooltipDate = document.getElementById('tooltip-date');
        this.tooltipDetails = document.getElementById('tooltip-details');
        this.loading = document.getElementById('loading');
        
        this.currentDays = 7;
        this.logs = [];
        this.settings = { sleepGoal: 480 };
        this.bars = [];
        this.isAnimating = false;
        this.animationProgress = 1;
        
        this.colors = {
            good: '#4ADE80',
            fair: '#FACC15',
            poor: '#FB923C',
            bad: '#F87171',
            empty: document.documentElement.classList.contains('dark') ? '#334155' : '#cbd5e1'
        };
        
        this.init();
    }
    
    async init() {
        this.setupCanvas();
        this.initEvents();
        await this.loadData();
    }
    
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * 2;
        this.canvas.height = rect.height * 2;
        this.ctx.scale(2, 2);
        this.width = rect.width;
        this.height = rect.height;
        this.padding = { top: 40, right: 20, bottom: 40, left: 20 };
    }
    
    initEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleHover(e));
        this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
        this.canvas.addEventListener('touchstart', (e) => this.handleHover(e), { passive: true });
        window.addEventListener('resize', () => this.handleResize());
    }
    
    async loadData() {
        this.loading.classList.remove('hidden');
        try {
            await appState.loadSettings();
            this.settings = appState.settings;
            
            const logsRes = await apiGet(`/api/sleep-logs?days=${this.currentDays}`);
            if (logsRes.success) {
                this.logs = logsRes.data;
            }
            
            this.prepareBars();
            this.animationProgress = 0;
            this.animate();
        } catch (err) {
            console.error('Failed to load chart:', err);
            showToast('Failed to load chart', 'error');
        } finally {
            this.loading.classList.add('hidden');
        }
    }
    
    prepareBars() {
        const days = [];
        const endDate = new Date();
        for (let i = this.currentDays - 1; i >= 0; i--) {
            const date = new Date(endDate);
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        
        const logMap = new Map(this.logs.map(l => [l.date, l]));
        
        this.bars = days.map(date => ({
            date,
            log: logMap.get(date) || null,
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }));
    }
    
    calculateDimensions() {
        const chartWidth = this.width - this.padding.left - this.padding.right;
        const chartHeight = this.height - this.padding.top - this.padding.bottom;
        const gap = Math.max(4, chartWidth / this.bars.length * 0.15);
        const barWidth = (chartWidth - gap * (this.bars.length - 1)) / this.bars.length;
        
        const maxMinutes = Math.max(...this.bars.map(b => b.log?.duration_minutes || this.settings.sleepGoal), this.settings.sleepGoal * 1.5);
        
        this.bars.forEach((bar, i) => {
            bar.x = this.padding.left + i * (barWidth + gap);
            bar.width = barWidth;
            
            if (bar.log) {
                const targetHeight = (bar.log.duration_minutes / maxMinutes) * chartHeight;
                bar.height = targetHeight * this.animationProgress;
                bar.y = this.height - this.padding.bottom - bar.height;
            } else {
                bar.height = chartHeight * 0.2;
                bar.y = this.height - this.padding.bottom - bar.height;
            }
        });
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.calculateDimensions();
        this.renderBars();
        this.renderGoalLine();
        this.renderLabels();
    }
    
    renderBars() {
        this.bars.forEach(bar => {
            if (bar.log) {
                const color = this.getBarColor(bar.log.duration_minutes);
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.roundRect(bar.x, bar.y, bar.width, bar.height, [6, 6, 0, 0]);
                this.ctx.fill();
            } else {
                this.ctx.strokeStyle = this.colors.empty;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([4, 4]);
                this.ctx.beginPath();
                this.ctx.roundRect(bar.x, bar.y, bar.width, bar.height, [6, 6, 0, 0]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        });
    }
    
    renderGoalLine() {
        const chartHeight = this.height - this.padding.top - this.padding.bottom;
        const maxMinutes = Math.max(...this.bars.map(b => b.log?.duration_minutes || this.settings.sleepGoal), this.settings.sleepGoal * 1.5);
        const goalY = this.height - this.padding.bottom - (this.settings.sleepGoal / maxMinutes) * chartHeight;
        
        this.ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#6366f1' : '#4f46e5';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([6, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding.left, goalY);
        this.ctx.lineTo(this.width - this.padding.right, goalY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        this.ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b';
        this.ctx.font = '10px Inter, sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Goal', this.width - 5, goalY - 5);
    }
    
    renderLabels() {
        this.ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b';
        this.ctx.font = '11px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        
        const labelInterval = this.currentDays <= 7 ? 1 : this.currentDays <= 14 ? 2 : 5;
        
        this.bars.forEach((bar, i) => {
            if (i % labelInterval === 0 || i === this.bars.length - 1) {
                const date = new Date(bar.date);
                const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                this.ctx.fillText(label, bar.x + bar.width / 2, this.height - 10);
            }
        });
    }
    
    getBarColor(duration) {
        const goal = this.settings.sleepGoal;
        const diff = duration - goal;
        
        if (diff >= 0) return this.colors.good;
        if (diff >= -30) return this.colors.fair;
        if (diff >= -60) return this.colors.poor;
        return this.colors.bad;
    }
    
    handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        const hoveredBar = this.bars.find(bar => 
            x >= bar.x && x <= bar.x + bar.width &&
            y >= bar.y && y <= this.height - this.padding.bottom
        );
        
        if (hoveredBar) {
            this.showTooltip(hoveredBar, e);
        } else {
            this.hideTooltip();
        }
    }
    
    showTooltip(bar, e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        if (bar.log) {
            this.tooltipDate.textContent = formatDate(bar.date);
            this.tooltipDetails.innerHTML = `
                <div>Duration: <span class="font-medium">${formatMinutes(bar.log.duration_minutes)}</span></div>
                <div>Bedtime: <span class="font-medium">${formatTime(bar.log.bedtime)}</span></div>
                <div>Wake: <span class="font-medium">${formatTime(bar.log.wake_time)}</span></div>
            `;
        } else {
            this.tooltipDate.textContent = formatDate(bar.date);
            this.tooltipDetails.innerHTML = '<div class="text-slate-400">No data logged</div>';
        }
        
        this.tooltip.classList.remove('hidden');
        
        const tooltipRect = this.tooltip.getBoundingClientRect();
        let left = clientX + 10;
        let top = clientY - tooltipRect.height - 10;
        
        if (left + tooltipRect.width > window.innerWidth) {
            left = clientX - tooltipRect.width - 10;
        }
        if (top < 0) {
            top = clientY + 10;
        }
        
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }
    
    hideTooltip() {
        this.tooltip.classList.add('hidden');
    }
    
    handleResize() {
        this.setupCanvas();
        this.render();
    }
    
    animate() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animationProgress = 0;
        
        const duration = 600;
        const startTime = performance.now();
        
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            this.animationProgress = Math.min(1, elapsed / duration);
            this.animationProgress = 1 - Math.pow(1 - this.animationProgress, 3);
            
            this.render();
            
            if (this.animationProgress < 1) {
                requestAnimationFrame(step);
            } else {
                this.isAnimating = false;
            }
        };
        
        requestAnimationFrame(step);
    }
}

// Period switch handler
window.switchPeriod = async function(days) {
    if (window.chart) {
        window.chart.currentDays = days;
        
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('text-primary-600', 'dark:text-primary-400', 'bg-white', 'dark:bg-night-700', 'shadow-sm');
            btn.classList.add('text-slate-600', 'dark:text-slate-400');
        });
        const activeBtn = document.getElementById(`btn-${days}`);
        if (activeBtn) {
            activeBtn.classList.add('text-primary-600', 'dark:text-primary-400', 'bg-white', 'dark:bg-night-700', 'shadow-sm');
            activeBtn.classList.remove('text-slate-600', 'dark:text-slate-400');
        }
        
        await window.chart.loadData();
    }
};

// Export chart as PNG
window.exportChart = function() {
    if (window.chart) {
        const link = document.createElement('a');
        link.download = `sleep-chart-${new Date().toISOString().split('T')[0]}.png`;
        link.href = window.chart.canvas.toDataURL('image/png');
        link.click();
        showToast('Chart exported successfully');
    }
};

// Initialize chart on page load
let chart;
document.addEventListener('DOMContentLoaded', () => {
    chart = new SleepChart();
    window.chart = chart;
});