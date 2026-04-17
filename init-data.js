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

// Create tables if they don't exist
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

// Check if data already exists
const count = db.prepare('SELECT COUNT(*) as count FROM sleep_logs').get();
if (count.count > 0) {
    console.log('Data already seeded, skipping...');
    db.close();
    process.exit(0);
}

// Helper function to calculate sleep duration in minutes
function calculateDuration(bedtime, wakeTime) {
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    
    let bedMinutes = bedHour * 60 + bedMin;
    let wakeMinutes = wakeHour * 60 + wakeMin;
    
    // If wake time is less than bedtime, it's the next day
    if (wakeMinutes <= bedMinutes) {
        wakeMinutes += 24 * 60;
    }
    
    return wakeMinutes - bedMinutes;
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Generate realistic sleep data
const sleepData = [
    // 30 days ago - good night
    { daysAgo: 30, bedtime: '22:30', wakeTime: '06:15', quality: 'good', notes: 'Fell asleep quickly after reading' },
    // 29 days ago - excellent
    { daysAgo: 29, bedtime: '22:00', wakeTime: '06:30', quality: 'excellent', notes: 'Deep sleep, woke up refreshed' },
    // 28 days ago - fair, late night
    { daysAgo: 28, bedtime: '00:15', wakeTime: '07:00', quality: 'fair', notes: 'Stayed up late finishing project' },
    // 27 days ago - skipped (missing data)
    // 26 days ago - good
    { daysAgo: 26, bedtime: '23:00', wakeTime: '06:45', quality: 'good', notes: 'Normal night' },
    // 25 days ago - poor
    { daysAgo: 25, bedtime: '01:30', wakeTime: '06:30', quality: 'poor', notes: 'Insomnia, couldn\'t fall asleep' },
    // 24 days ago - good recovery
    { daysAgo: 24, bedtime: '22:00', wakeTime: '07:00', quality: 'excellent', notes: 'Caught up on sleep, felt great' },
    // 23 days ago - good
    { daysAgo: 23, bedtime: '22:45', wakeTime: '06:30', quality: 'good', notes: 'Relaxing evening routine helped' },
    // 22 days ago - fair
    { daysAgo: 22, bedtime: '23:30', wakeTime: '06:15', quality: 'fair', notes: 'Woke up once during the night' },
    // 21 days ago - excellent
    { daysAgo: 21, bedtime: '21:45', wakeTime: '06:00', quality: 'excellent', notes: 'Early bedtime, perfect sleep' },
    // 20 days ago - good
    { daysAgo: 20, bedtime: '22:30', wakeTime: '06:30', quality: 'good', notes: 'Solid 8 hours' },
    // 19 days ago - skipped (missing data)
    // 18 days ago - fair
    { daysAgo: 18, bedtime: '23:45', wakeTime: '06:30', quality: 'fair', notes: 'Screens before bed probably didn\'t help' },
    // 17 days ago - poor
    { daysAgo: 17, bedtime: '01:00', wakeTime: '06:45', quality: 'poor', notes: 'Stress from work kept me awake' },
    // 16 days ago - good
    { daysAgo: 16, bedtime: '22:15', wakeTime: '06:15', quality: 'good', notes: 'Meditation before bed was helpful' },
    // 15 days ago - excellent
    { daysAgo: 15, bedtime: '22:00', wakeTime: '06:30', quality: 'excellent', notes: 'Perfect sleep schedule day' },
    // 14 days ago - good
    { daysAgo: 14, bedtime: '22:30', wakeTime: '06:30', quality: 'good', notes: 'Consistent timing paying off' },
    // 13 days ago - good
    { daysAgo: 13, bedtime: '23:00', wakeTime: '07:00', quality: 'good', notes: 'Weekend sleep-in' },
    // 12 days ago - excellent
    { daysAgo: 12, bedtime: '22:00', wakeTime: '07:15', quality: 'excellent', notes: 'Lazy weekend morning, great rest' },
    // 11 days ago - fair
    { daysAgo: 11, bedtime: '23:45', wakeTime: '06:30', quality: 'fair', notes: 'Dreams kept waking me up' },
    // 10 days ago - good
    { daysAgo: 10, bedtime: '22:30', wakeTime: '06:20', quality: 'good', notes: 'Steady night' },
    // 9 days ago - poor
    { daysAgo: 9, bedtime: '00:30', wakeTime: '06:00', quality: 'poor', notes: 'Late night gaming was a mistake' },
    // 8 days ago - good
    { daysAgo: 8, bedtime: '22:00', wakeTime: '06:15', quality: 'good', notes: 'Back on track' },
    // 7 days ago - excellent
    { daysAgo: 7, bedtime: '21:45', wakeTime: '06:00', quality: 'excellent', notes: 'Amazing sleep, felt super energetic' },
    // 6 days ago - good
    { daysAgo: 6, bedtime: '22:30', wakeTime: '06:30', quality: 'good', notes: 'Nice and consistent' },
    // 5 days ago - good
    { daysAgo: 5, bedtime: '23:00', wakeTime: '06:45', quality: 'good', notes: 'Slightly later but still good' },
    // 4 days ago - fair
    { daysAgo: 4, bedtime: '23:30', wakeTime: '06:15', quality: 'fair', notes: 'Restless, too warm in bedroom' },
    // 3 days ago - good
    { daysAgo: 3, bedtime: '22:15', wakeTime: '06:30', quality: 'good', notes: 'Cooler room temperature helped' },
    // 2 days ago - excellent
    { daysAgo: 2, bedtime: '22:00', wakeTime: '06:15', quality: 'excellent', notes: 'Pre-sleep yoga really works' },
    // 1 day ago - good
    { daysAgo: 1, bedtime: '22:30', wakeTime: '06:30', quality: 'good', notes: 'Solid night before work' },
    // Today (last night) - good
    { daysAgo: 0, bedtime: '22:45', wakeTime: '06:45', quality: 'good', notes: 'Ready for the day' },
];

// Prepare insert statement
const insertLog = db.prepare(`
    INSERT INTO sleep_logs (date, bedtime, wake_time, duration_minutes, quality, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertSetting = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
`);

// Wrap all inserts in a transaction
const insertAll = db.transaction(() => {
    const now = new Date();
    
    // Insert sleep logs
    for (const entry of sleepData) {
        const entryDate = new Date(now);
        entryDate.setDate(entryDate.getDate() - entry.daysAgo);
        const dateStr = formatDate(entryDate);
        
        const duration = calculateDuration(entry.bedtime, entry.wakeTime);
        
        // Spread created_at timestamps slightly for realism
        const createdAt = new Date(entryDate);
        createdAt.setHours(8 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60));
        
        // Some entries have been updated
        const updatedAt = Math.random() > 0.7 
            ? new Date(createdAt.getTime() + Math.random() * 3600000 * 2)
            : createdAt;
        
        insertLog.run(
            dateStr,
            entry.bedtime,
            entry.wakeTime,
            duration,
            entry.quality,
            entry.notes,
            createdAt.toISOString(),
            updatedAt.toISOString()
        );
    }
    
    // Insert settings
    insertSetting.run('sleepGoal', '480'); // 8 hours in minutes
    insertSetting.run('darkMode', 'true');
    insertSetting.run('userName', 'Alex');
});

insertAll();

// Get counts for summary
const logCount = db.prepare('SELECT COUNT(*) as count FROM sleep_logs').get();
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();

console.log(`Seeded: ${logCount.count} sleep logs, ${settingsCount.count} settings`);
console.log('\nSleep data spans the last 30 days with realistic patterns:');
console.log('- Average sleep: ~7.5 hours');
console.log('- Mix of excellent, good, fair, and poor quality nights');
console.log('- Some days intentionally missing (realistic gaps)');
console.log('- Current streak: 2+ days meeting 8-hour goal');
console.log('\nDefault settings:');
console.log('- Sleep goal: 8 hours (480 minutes)');
console.log('- Dark mode: enabled');

db.close();