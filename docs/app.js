// Food Recovery Buddy Main App Logic (No Authentication Version)

// IndexedDB for offline queue (simple version)
const DB_NAME = 'frb-offline';
const DB_STORE = 'queue';

// Utility for IndexedDB queue
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true });
        req.onsuccess = () => resolve(req.result);
        req.onerror = reject;
    });
}
function addToQueue(entry) {
    return openDB().then(db => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).add(entry);
        return tx.complete;
    });
}
function getQueue() {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DB_STORE, 'readonly');
            const store = tx.objectStore(DB_STORE);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = reject;
        });
    });
}
function clearQueue() {
    return openDB().then(db => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).clear();
        return tx.complete;
    });
}

// UI Elements
const checklistSection = document.getElementById('checklistSection');
const offlineQueueSection = document.getElementById('offlineQueueSection');
const healthCheckBtn = document.getElementById('healthCheckBtn');

// Load tasks and users
async function loadChecklist() {
    const [tasks, users] = await Promise.all([
        fetch('tasks.json').then(r => r.json()),
        fetch('users.json').then(r => r.json())
    ]);
    // User select
    let userSel = document.createElement('select');
    userSel.id = "userSelector";
    users.forEach(u => {
        let opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.name;
        userSel.appendChild(opt);
    });
    document.getElementById('userSelect').appendChild(userSel);

    // Checklist
    let taskList = document.getElementById('taskList');
    taskList.innerHTML = "";
    // Show only today's tasks
    const today = new Date().toLocaleString('en-US', { weekday: 'long' });
    tasks.filter(task => task.days.includes(today)).forEach(task => {
        let li = document.createElement('li');
        li.textContent = task.title + (task.details ? ` (${task.details})` : "");
        let btn = document.createElement('button');
        btn.textContent = "Complete";
        btn.onclick = () => completeTask(task, userSel.value);
        li.appendChild(btn);
        taskList.appendChild(li);
    });
}

// Task completion
function completeTask(task, userId) {
    const entry = {
        taskId: task.id,
        title: task.title,
        userId,
        timestamp: new Date().toISOString(),
        details: task.details || ""
    };
    // In this version, just queue everything (no online logging)
    addToQueue(entry).then(updateOfflineQueueUI);
}
function updateOfflineQueueUI() {
    getQueue().then(queue => {
        offlineQueueSection.style.display = queue.length ? "" : "none";
        const ul = document.getElementById('offlineQueue');
        ul.innerHTML = "";
        queue.forEach(q => {
            let li = document.createElement('li');
            li.textContent = `${q.title} by ${q.userId} at ${q.timestamp}`;
            ul.appendChild(li);
        });
    });
}

// Health check button
healthCheckBtn.onclick = () => window.location.href = "health-check.html";

// Midnight reset
function scheduleMidnightReset() {
    const now = new Date();
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    setTimeout(() => {
        window.location.reload();
    }, msToMidnight);
}
scheduleMidnightReset();

// Init
document.addEventListener('DOMContentLoaded', () => {
    checklistSection.style.display = "";
    loadChecklist();
    updateOfflineQueueUI();
});
