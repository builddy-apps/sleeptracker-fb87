import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database connection
const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

// Create tables and indexes
const schema = `
CREATE TABLE IF NOT EXISTS sleep_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    bedtime TEXT,
    wake_time TEXT,
    duration_minutes INTEGER,
    quality TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_date ON sleep_logs(date);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_created_at ON sleep_logs(created_at);
`;

db.exec(schema);

// Helper Functions

export function getSleepLogs(startDate, endDate) {
    const stmt = db.prepare(`
        SELECT * FROM sleep_logs 
        WHERE date BETWEEN ? AND ? 
        ORDER BY date ASC
    `);
    return stmt.all(startDate, endDate);
}

export function upsertSleepLog(data) {
    const stmt = db.prepare(`
        INSERT INTO sleep_logs (date, bedtime, wake_time, duration_minutes, quality, notes, updated_at)
        VALUES (@date, @bedtime, @wake_time, @duration_minutes, @quality, @notes, CURRENT_TIMESTAMP)
        ON CONFLICT(date) DO UPDATE SET
            bedtime = excluded.bedtime,
            wake_time = excluded.wake_time,
            duration_minutes = excluded.duration_minutes,
            quality = excluded.quality,
            notes = excluded.notes,
            updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(data);
}

export function getSetting(key) {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key);
    return row ? row.value : null;
}

export function setSetting(key, value) {
    const stmt = db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(key, value);
}

export function getStreakInfo() {
    const goalMinutesStr = getSetting('sleepGoal');
    const goalMinutes = goalMinutesStr ? parseInt(goalMinutesStr, 10) : 480;

    // Fetch all logs ordered by date desc for current streak calculation
    const logsDesc = db.prepare('SELECT date, duration_minutes FROM sleep_logs ORDER BY date DESC').all();
    
    let currentStreak = 0;
    let lastDate = null;
    
    // Calculate current streak (must be consecutive days meeting goal)
    for (const log of logsDesc) {
        const logDate = new Date(log.date);
        if (!lastDate) {
            // If the most recent log is today or yesterday, start checking
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(today - logDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 1 && log.duration_minutes >= goalMinutes) {
                currentStreak++;
                lastDate = logDate;
            } else {
                break;
            }
        } else {
            const diffTime = Math.abs(lastDate - logDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1 && log.duration_minutes >= goalMinutes) {
                currentStreak++;
                lastDate = logDate;
            } else {
                break;
            }
        }
    }

    // Calculate best streak (scan all logs ascending)
    const logsAsc = db.prepare('SELECT date, duration_minutes FROM sleep_logs ORDER BY date ASC').all();
    let bestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const log of logsAsc) {
        const logDate = new Date(log.date);
        if (!prevDate) {
            if (log.duration_minutes >= goalMinutes) {
                tempStreak = 1;
                prevDate = logDate;
            }
        } else {
            const diffTime = Math.abs(prevDate - logDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1 && log.duration_minutes >= goalMinutes) {
                tempStreak++;
                prevDate = logDate;
            } else {
                // Reset streak, starting a new potential streak from current log if it meets goal
                if (log.duration_minutes >= goalMinutes) {
                    tempStreak = 1;
                } else {
                    tempStreak = 0;
                }
                prevDate = logDate;
            }
        }
        if (tempStreak > bestStreak) bestStreak = tempStreak;
    }

    return { current: currentStreak, best: bestStreak };
}

export function getSleepDebt() {
    const goalMinutesStr = getSetting('sleepGoal');
    const goalMinutes = goalMinutesStr ? parseInt(goalMinutesStr, 10) : 480;
    
    // Calculate debt for the last 14 days only
    const stmt = db.prepare(`
        SELECT duration_minutes FROM sleep_logs
        WHERE date >= date('now', '-14 days')
        ORDER BY date ASC
    `);
    const logs = stmt.all();

    let totalDebt = 0;
    for (const log of logs) {
        // Positive value = debt, Negative value = surplus
        totalDebt += (goalMinutes - log.duration_minutes);
    }

    return totalDebt;
}

export default db;