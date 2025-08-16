// Food Recovery Buddy Main App Logic

// DEMO MODE by appending to URL index.html?demo=1 and it’ll show the checklist UI without signing in.
const demoMode = window.location.search.includes('demo=1');

// In initAuth(), after defining msalInstance:
if (demoMode) {
    // Fake login: skip real MS sign-in
    authSection.style.display = "none";
    checklistSection.style.display = "";
    loadChecklist();
    return;
}

// Load MSAL config
importScripts('msal-config.js');

let msalInstance = null;
let account = null;

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
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authSection = document.getElementById('authSection');
const checklistSection = document.getElementById('checklistSection');
const offlineQueueSection = document.getElementById('offlineQueueSection');
const healthCheckBtn = document.getElementById('healthCheckBtn');

// Auth & registration
function initAuth() {
    msalInstance = new msal.PublicClientApplication(msalConfig);
    loginBtn.onclick = () => msalInstance.loginPopup(loginRequest).then(handleLogin);
}
function handleLogin(resp) {
    account = resp.account;
    authSection.style.display = "none";
    checklistSection.style.display = "";
    loadChecklist();
}
logoutBtn.onclick = () => {
    msalInstance.logoutPopup();
    checklistSection.style.display = "none";
    authSection.style.display = "";
};

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
    tasks.forEach(task => {
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
    if (navigator.onLine) {
        logToExcel(entry);
    } else {
        addToQueue(entry).then(updateOfflineQueueUI);
    }
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

// Log to Microsoft Graph Excel
async function logToExcel(entry) {
    // Get token
    const tokenResp = await msalInstance.acquireTokenSilent(loginRequest);
    const token = tokenResp.accessToken;
    // API call (placeholder; replace with actual Excel Graph API logic)
    fetch('https://graph.microsoft.com/v1.0/me/drive/items/<WORKBOOK_ID>/workbook/tables/<TABLE_NAME>/rows/add', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values: [[entry.taskId, entry.title, entry.userId, entry.timestamp, entry.details]]
        })
    }).then(resp => {
        if (!resp.ok) throw new Error("Excel log failed");
    }).catch(err => {
        // If error, queue for retry
        addToQueue(entry).then(updateOfflineQueueUI);
    });
}

// Sync offline queue when online
window.addEventListener('online', () => {
    getQueue().then(queue => {
        if (queue.length) {
            queue.forEach(entry => logToExcel(entry));
            clearQueue().then(updateOfflineQueueUI);
        }
    });
});

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
initAuth();
updateOfflineQueueUI();
