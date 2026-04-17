import express from 'express';
import cors from 'cors';
import { getSleepLogs, upsertSleepLog, getSetting, setSetting, getStreakInfo, getSleepDebt } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// GET /api/sleep-logs?days=N - Get sleep logs for last N days
app.get('/api/sleep-logs', (req, res) => {
    try {
        const days = parseInt(req.query.days, 10) || 7;
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const logs = getSleepLogs(startDate, endDate);
        res.json({ success: true, data: logs });
    } catch (err) {
        console.error('Error fetching sleep logs:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch sleep logs' });
    }
});

// POST /api/sleep-logs - Create or update a sleep entry
app.post('/api/sleep-logs', (req, res) => {
    try {
        const { date, bedtime, wake_time, notes } = req.body;
        
        if (!date || !bedtime || !wake_time) {
            return res.status(400).json({ success: false, error: 'Missing required fields: date, bedtime, wake_time' });
        }

        // Calculate duration (accounting for overnight sleep)
        const [bedHour, bedMin] = bedtime.split(':').map(Number);
        const [wakeHour, wakeMin] = wake_time.split(':').map(Number);
        
        let bedMinutes = bedHour * 60 + bedMin;
        let wakeMinutes = wakeHour * 60 + wakeMin;
        
        let durationMinutes = wakeMinutes - bedMinutes;
        if (durationMinutes <= 0) {
            durationMinutes += 24 * 60; // Overnight: add 24 hours
        }

        // Determine quality based on goal
        const goalMinutes = parseInt(getSetting('sleepGoal') || '480', 10);
        let quality = 'poor';
        if (durationMinutes >= goalMinutes) quality = 'good';
        else if (durationMinutes >= goalMinutes - 30) quality = 'fair';
        else if (durationMinutes >= goalMinutes - 60) quality = 'poor';
        else quality = 'bad';

        const data = {
            date,
            bedtime,
            wake_time,
            duration_minutes: durationMinutes,
            quality,
            notes: notes || ''
        };

        upsertSleepLog(data);
        res.json({ success: true, data: { ...data, duration_minutes: durationMinutes, quality } });
    } catch (err) {
        console.error('Error saving sleep log:', err);
        res.status(500).json({ success: false, error: 'Failed to save sleep log' });
    }
});

// GET /api/settings - Get all settings
app.get('/api/settings', (req, res) => {
    try {
        const goal = getSetting('sleepGoal');
        const darkMode = getSetting('darkMode');
        res.json({ success: true, data: { sleepGoal: goal || '480', darkMode: darkMode || 'false' } });
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
});

// PUT /api/settings - Update a setting
app.put('/api/settings', (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key || value === undefined) {
            return res.status(400).json({ success: false, error: 'Missing key or value' });
        }
        setSetting(key, String(value));
        res.json({ success: true, data: { key, value } });
    } catch (err) {
        console.error('Error updating setting:', err);
        res.status(500).json({ success: false, error: 'Failed to update setting' });
    }
});

// GET /api/stats - Get computed statistics
app.get('/api/stats', (req, res) => {
    try {
        const streakInfo = getStreakInfo();
        const sleepDebt = getSleepDebt();

        // Weekly average (last 7 days)
        const weekLogs = getSleepLogs(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
        );
        const weeklyAvg = weekLogs.length > 0 
            ? Math.round(weekLogs.reduce((sum, log) => sum + log.duration_minutes, 0) / weekLogs.length)
            : 0;

        // Monthly average (last 30 days)
        const monthLogs = getSleepLogs(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
        );
        const monthlyAvg = monthLogs.length > 0
            ? Math.round(monthLogs.reduce((sum, log) => sum + log.duration_minutes, 0) / monthLogs.length)
            : 0;

        // Best and worst sleep days
        let bestDay = null;
        let worstDay = null;
        for (const log of [...weekLogs, ...monthLogs]) {
            if (!bestDay || log.duration_minutes > bestDay.duration_minutes) {
                bestDay = log;
            }
            if (!worstDay || log.duration_minutes < worstDay.duration_minutes) {
                worstDay = log;
            }
        }

        res.json({
            success: true,
            data: {
                weeklyAverage: weeklyAvg,
                monthlyAverage: monthlyAvg,
                currentStreak: streakInfo.current,
                bestStreak: streakInfo.best,
                sleepDebt: sleepDebt,
                bestDay: bestDay ? { date: bestDay.date, duration: bestDay.duration_minutes } : null,
                worstDay: worstDay ? { date: worstDay.date, duration: worstDay.duration_minutes } : null
            }
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
    }
});

// GET /api/export?format=csv - Export sleep data
app.get('/api/export', (req, res) => {
    try {
        const format = req.query.format || 'csv';
        if (format !== 'csv') {
            return res.status(400).json({ success: false, error: 'Only CSV format is supported' });
        }

        const logs = getSleepLogs('1970-01-01', new Date().toISOString().split('T')[0]);
        
        const header = 'Date,Bedtime,Wake Time,Duration (min),Quality,Notes\n';
        const rows = logs.map(log => 
            `${log.date},${log.bedtime},${log.wake_time},${log.duration_minutes},${log.quality},"${log.notes || ''}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sleepwell-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(header + rows);
    } catch (err) {
        console.error('Error exporting data:', err);
        res.status(500).json({ success: false, error: 'Failed to export data' });
    }
});

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`SleepWell server running on port ${PORT}`);
});