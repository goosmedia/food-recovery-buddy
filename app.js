class FoodRecoveryBuddy {
    constructor() {
        this.db = null;
        this.currentUser = null;
        this.todayTasks = [];
        this.completedTasks = [];
        this.config = null;
        
        this.init();
    }

    /**
     * Initialize the application
     * Loads configuration, sets up database, and renders initial UI
     */
    async init() {
        await this.loadConfig();
        await this.initDatabase();
        this.setupEventListeners();
        this.updateDateDisplay();
        this.loadTodayData();
        this.renderUserSelection();
    }

    /**
     * Load application configuration from config.json
     * Falls back to default config if loading fails
     */
    async loadConfig() {
        try {
            const response = await fetch('data/config.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.config = await response.json();
            
        } catch (error) {
            console.error('Failed to load config:', error);
            
            // Fallback config with sample tasks for development
            this.config = {
                users: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
                adminPin: '7778',
                tasks: [
                    {
                        "id": "daily-100",
                        "task": "Check refrigerator temperatures",
                        "explanation": "Verify all refrigerators are maintaining proper temperature ranges",
                        "day_of_week": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
                        "order_sequencer": 100
                    },
                    {
                        "id": "daily-200",
                        "task": "Inspect food quality",
                        "explanation": "Check for any spoiled or expired food items",
                        "day_of_week": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
                        "order_sequencer": 200
                    }
                ]
            };
        }
    }

    /**
     * Initialize IndexedDB for local data storage
     * Creates stores for daily data and completion logs
     */
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FoodRecoveryBuddy', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create completion logs store for tracking all task completions
                if (!db.objectStoreNames.contains('completionLogs')) {
                    const completionStore = db.createObjectStore('completionLogs', { keyPath: 'id', autoIncrement: true });
                    completionStore.createIndex('timestamp', 'timestamp', { unique: false });
                    completionStore.createIndex('date', 'date', { unique: false });
                    completionStore.createIndex('user_name', 'user_name', { unique: false });
                }
                
                // Create daily data store for current day's work
                if (!db.objectStoreNames.contains('dailyData')) {
                    const dailyStore = db.createObjectStore('dailyData', { keyPath: 'date' });
                }
            };
        });
    }

    /**
     * Set up all event listeners for user interactions
     * Handles user selection, task completion, and navigation
     */
    setupEventListeners() {
        // User selection from initial grid
        document.getElementById('userGrid').addEventListener('click', (e) => {
            if (e.target.classList.contains('user-btn')) {
                this.selectUser(e.target.textContent);
            }
        });

        // Task completion toggling
        document.getElementById('taskContainer').addEventListener('click', (e) => {
            if (e.target.closest('.task-item')) {
                const taskItem = e.target.closest('.task-item');
                const taskId = taskItem.dataset.taskId;
                this.toggleTaskCompletion(taskId);
            }
        });

        // Action buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveAndComplete());
        
        // Summary page buttons
        document.getElementById('returnToTasksBtn').addEventListener('click', () => this.returnToTasks());
        document.getElementById('downloadCsvBtn').addEventListener('click', () => this.showExportInfo());
        document.getElementById('resetTasksBtn').addEventListener('click', () => this.confirmResetTasks());
    }

    /**
     * Update the date display in the header
     * Shows current date in a user-friendly format
     */
    updateDateDisplay() {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('dateDisplay').textContent = today.toLocaleDateString('en-US', options);
    }

    /**
     * Get today's tasks based on current day of week
     * Filters tasks from config and sorts by priority order
     */
    getTodayTasks() {
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        const filteredTasks = this.config.tasks
            .filter(task => task.day_of_week.includes(dayName))
            .sort((a, b) => a.order_sequencer - b.order_sequencer);
        
        return filteredTasks;
    }

    /**
     * Render the initial user selection grid
     * Creates clickable buttons for each user from config
     */
    renderUserSelection() {
        const userGrid = document.getElementById('userGrid');
        userGrid.innerHTML = '';
        
        this.config.users.forEach(user => {
            const userBtn = document.createElement('button');
            userBtn.className = 'user-btn';
            userBtn.textContent = user;
            userGrid.appendChild(userBtn);
        });
    }

    /**
     * Handle user selection and transition to task view
     * Loads today's tasks and shows the task list interface
     */
    selectUser(userName) {
        this.currentUser = userName;
        this.todayTasks = this.getTodayTasks();
        
        // Load today's data to get current completion state
        this.loadTodayData();
        
        // Show bottom user bar and hide user selection
        document.getElementById('userSelection').classList.add('hidden');
        document.getElementById('bottomUserBar').classList.remove('hidden');
        document.getElementById('taskList').classList.remove('hidden');
        
        // Render the bottom quick user switcher
        this.renderBottomQuickUserSwitcher();
        
        this.renderTasks();
        this.renderTaskSummary().catch(error => {
            console.error('Failed to render task summary:', error);
        });
    }

    /**
     * Load today's completion data from IndexedDB
     * Retrieves stored task completions for the current date
     */
    async loadTodayData() {
        const today = this.getTodayDateString();
        const dailyData = await this.getDailyData(today);
        
        if (dailyData) {
            this.completedTasks = dailyData.completedTasks || [];
        } else {
            this.completedTasks = [];
        }
    }

    /**
     * Render the task list with completion status
     * Shows all today's tasks with visual indicators for completed items
     */
    renderTasks() {
        const taskContainer = document.getElementById('taskContainer');
        taskContainer.innerHTML = '';
        
        if (!this.todayTasks || this.todayTasks.length === 0) {
            taskContainer.innerHTML = '<p>No tasks available for today.</p>';
            return;
        }
        
        this.todayTasks.forEach(task => {
            const completion = this.completedTasks.find(ct => ct.task_id === task.id);
            const isCompleted = !!completion;
            
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${isCompleted ? 'completed' : ''}`;
            taskElement.dataset.taskId = task.id;
            
            let completionInfo = '';
            if (isCompleted) {
                const time = new Date(completion.completed_at).toLocaleTimeString();
                completionInfo = `
                    <div class="task-completion-info">
                        <span class="completion-user">✓ ${completion.user_name}</span>
                        <span class="completion-time">${time}</span>
                    </div>
                `;
            }
            
            taskElement.innerHTML = `
                <div class="task-name">${task.task}</div>
                <div class="task-explanation">${task.explanation}</div>
                ${completionInfo}
            `;
            
            taskContainer.appendChild(taskElement);
        });
        
        // Also render the task summary
        this.renderTaskSummary().catch(error => {
            console.error('Failed to render task summary:', error);
        });
    }

    /**
     * Toggle task completion status
     * Adds or removes completion records and saves to IndexedDB
     */
    toggleTaskCompletion(taskId) {
        const taskIndex = this.completedTasks.findIndex(ct => ct.task_id === taskId);
        
        if (taskIndex === -1) {
            // Add completion
            const task = this.todayTasks.find(t => t.id === taskId);
            const completion = {
                task_id: taskId,
                user_name: this.currentUser,
                completed_at: new Date().toISOString(),
                timestamp: Date.now(),
                date: this.getTodayDateString()
            };
            
            this.completedTasks.push(completion);
        } else {
            // Remove completion
            this.completedTasks.splice(taskIndex, 1);
        }
        
        // Save to IndexedDB immediately to persist changes
        this.saveDailyData();
        
        this.renderTasks();
    }

    /**
     * Show completion summary page
     * Displays all completed tasks and navigation options
     */
    async saveAndComplete() {
        if (this.completedTasks.length === 0) {
            alert('Please complete at least one task before saving.');
            return;
        }
        
        try {
            // Data is already saved, just show completion summary
            this.showCompletionSummary();
            
        } catch (error) {
            console.error('Failed to show completion summary:', error);
            alert('Failed to show completion summary. Please try again.');
        }
    }

    /**
     * Save current day's data to IndexedDB
     * Stores completion state for the current date
     */
    async saveDailyData() {
        const today = this.getTodayDateString();
        const dailyData = {
            date: today,
            user: this.currentUser,
            completedTasks: this.completedTasks,
            timestamp: Date.now()
        };
        
        return this.putDailyData(dailyData);
    }

    /**
     * Save completion logs to IndexedDB
     * Stores individual task completion records
     */
    async saveCompletionLogs() {
        const promises = this.completedTasks.map(completion => {
            return this.addCompletionLog(completion);
        });
        
        return Promise.all(promises);
    }

    /**
     * Display completion summary with all completed tasks
     * Shows user contributions and completion times
     */
    showCompletionSummary() {
        document.getElementById('taskList').classList.add('hidden');
        
        const summaryList = document.getElementById('summaryList');
        summaryList.innerHTML = '';
        
        this.completedTasks.forEach(completion => {
            const task = this.todayTasks.find(t => t.id === completion.task_id);
            const time = new Date(completion.completed_at).toLocaleTimeString();
            
            const summaryItem = document.createElement('div');
            summaryItem.className = 'summary-item';
            summaryItem.innerHTML = `
                <div>
                    <div class="summary-task">${task ? task.task : 'Unknown Task'}</div>
                    <div class="summary-user">Completed by: ${completion.user_name}</div>
                </div>
                <div class="summary-time">${time}</div>
            `;
            
            summaryList.appendChild(summaryItem);
        });
        
        document.getElementById('completionSummary').classList.remove('hidden');
    }

    /**
     * Generate CSV content from completed tasks
     * Creates formatted CSV with headers and task data
     */
    generateCSV() {
        const headers = ['Date', 'User', 'Task', 'Completed At', 'Timestamp'];
        const rows = this.completedTasks.map(completion => {
            const task = this.todayTasks.find(t => t.id === completion.task_id);
            return [
                completion.date,
                completion.user_name,
                task ? task.task : 'Unknown Task',
                completion.completed_at,
                completion.timestamp
            ];
        });
        
        const csvRows = [headers, ...rows];
        return csvRows.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    /**
     * Get today's date in YYYY-MM-DD format
     * Used for IndexedDB key generation and file naming
     */
    getTodayDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    /**
     * Get count of stored completion logs
     * Used for storage information display
     */
    async getCompletionLogsCount() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['completionLogs'], 'readonly');
            const store = transaction.objectStore('completionLogs');
            const request = store.count();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all completion logs from IndexedDB
     * Used after CSV export to prevent storage bloat
     */
    async clearCompletionLogs() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['completionLogs'], 'readwrite');
            const store = transaction.objectStore('completionLogs');
            const request = store.clear();
            
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * IndexedDB helper methods for data persistence
     * Handle all database operations for daily data and completion logs
     */
    async putDailyData(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['dailyData'], 'readwrite');
            const store = transaction.objectStore('dailyData');
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getDailyData(date) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['dailyData'], 'readonly');
            const store = transaction.objectStore('dailyData');
            const request = store.get(date);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async addCompletionLog(completion) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['completionLogs'], 'readwrite');
            const store = transaction.objectStore('completionLogs');
            const request = store.add(completion);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Render the bottom user switcher bar
     * Shows current user and allows quick switching between users
     */
    renderBottomQuickUserSwitcher() {
        const userListContainer = document.getElementById('bottomQuickUserList');
        const currentUserNameElement = document.getElementById('bottomCurrentUserName');
        
        // Update current user display
        currentUserNameElement.textContent = this.currentUser;
        
        // Clear and populate user list
        userListContainer.innerHTML = '';
        
        this.config.users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = `quick-user-item ${user === this.currentUser ? 'current' : ''}`;
            userItem.textContent = user;
            userItem.dataset.userName = user;
            
            // Add click handler for user switching
            userItem.addEventListener('click', () => {
                if (user !== this.currentUser) {
                    this.switchToUser(user);
                }
            });
            
            userListContainer.appendChild(userItem);
        });
    }

    /**
     * Switch to a different user without going back to selection screen
     * Updates current user and re-renders interface
     */
    switchToUser(userName) {
        // Update current user
        this.currentUser = userName;
        
        // Re-render the bottom quick user switcher to update highlighting
        this.renderBottomQuickUserSwitcher();
        
        // Update the task list to reflect the new user
        this.renderTasks();
        this.renderTaskSummary().catch(error => {
            console.error('Failed to render task summary:', error);
        });
    }

    /**
     * Return to task list from summary page
     * Maintains current user and completion state
     */
    returnToTasks() {
        // Hide completion summary, show task list
        document.getElementById('completionSummary').classList.add('hidden');
        document.getElementById('taskList').classList.remove('hidden');
        
        // Bottom user bar should remain visible
    }

    /**
     * Confirm admin PIN and reset today's tasks
     * Requires admin PIN from config.json for security
     */
    confirmResetTasks() {
        // Get admin PIN from config
        const adminPin = this.config.adminPin || '7778';
        
        // Prompt for admin PIN
        const enteredPin = prompt(
            '🔒 Admin Access Required\n\n' +
            'Enter admin PIN to reset today\'s tasks:\n\n' +
            '⚠️ This action cannot be undone!'
        );
        
        if (enteredPin === null) {
            // User cancelled
            return;
        }
        
        if (enteredPin !== adminPin) {
            alert('❌ Incorrect admin PIN. Reset cancelled.');
            return;
        }
        
        // PIN is correct, show final confirmation
        const confirmed = confirm(
            '⚠️ FINAL WARNING: This will reset ALL completed tasks for today.\n\n' +
            '✅ Admin PIN verified\n' +
            '🗑️ All today\'s completions will be cleared\n' +
            '📱 You can continue working on tasks\n\n' +
            'This action cannot be undone. Proceed with reset?'
        );
        
        if (confirmed) {
            this.resetTodayTasks();
        }
    }

    /**
     * Reset all completed tasks for today
     * Clears local data and returns to task list
     */
    resetTodayTasks() {
        // Clear completed tasks
        this.completedTasks = [];
        
        // Clear from IndexedDB
        this.clearDailyData();
        
        // Return to task list
        this.returnToTasks();
        
        // Re-render tasks to show they're not completed
        this.renderTasks();
        this.renderTaskSummary().catch(error => {
            console.error('Failed to render task summary:', error);
        });
        
        // Show success message
        alert('✅ Today\'s tasks have been reset successfully!\n\nAll completed tasks have been cleared.\nYou can now start fresh with today\'s task list.');
    }

    /**
     * Clear daily data for a specific date from IndexedDB
     * Used when resetting tasks for a particular day
     */
    async clearDailyData() {
        const today = this.getTodayDateString();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['dailyData'], 'readwrite');
            const store = transaction.objectStore('dailyData');
            const request = store.delete(today);
            
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Show export information before CSV download
     * Displays data counts and warns about storage cleanup
     */
    async showExportInfo() {
        try {
            // Ensure today's data is loaded
            await this.loadTodayData();
            
            // Check if there are completed tasks for today
            if (this.completedTasks.length === 0) {
                alert('No completed tasks to download for today.');
                return;
            }
            
            // Get total stored completion logs for informational purposes
            const totalStoredCompletions = await this.getCompletionLogsCount();
            
            const infoMessage = 
                `📊 Data Export Information:\n\n` +
                `📱 Today's Completed: ${this.completedTasks.length} tasks\n` +
                `📱 Total Stored: ${totalStoredCompletions} completion records\n` +
                `📅 Export Includes: All completed tasks for today\n` +
                `🗑️ After Export: Local storage will be cleared\n\n` +
                `⚠️ Important: Make sure to save your CSV file before closing!\n\n` +
                `Proceed with export?`;
            
            const confirmed = confirm(infoMessage);
            
            if (confirmed) {
                this.exportToCSV();
            }
            
        } catch (error) {
            console.error('Failed to show export info:', error);
            // Fallback to direct export
            this.exportToCSV();
        }
    }

    /**
     * Export completed tasks to CSV format
     * Downloads file and clears local completion logs
     */
    async exportToCSV() {
        if (this.completedTasks.length === 0) {
            alert('No completed tasks to download.');
            return;
        }
        
        // Warn user about clearing local storage
        const confirmed = confirm(
            '📋 CSV Export Notice:\n\n' +
            'This will download your CSV file AND clear the local task completion history.\n\n' +
            '✅ Your CSV will contain ALL completed tasks\n' +
            '🗑️ Local storage will be cleared after download\n' +
            '📱 You can continue working on today\'s tasks\n\n' +
            'Proceed with export and cleanup?'
        );
        
        if (!confirmed) {
            return;
        }
        
        try {
            // Generate and download CSV
            const csvContent = this.generateCSV();
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `food-recovery-${this.getTodayDateString()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            // Clear completion logs after successful export
            await this.clearCompletionLogs();
            
            // Show success message
            alert('✅ CSV exported successfully!\n\nLocal task completion history has been cleared.\nYou can continue working on today\'s tasks.');
            
        } catch (error) {
            console.error('Failed to export CSV:', error);
            alert('❌ Failed to export CSV. Please try again.\n\nYour local data has NOT been cleared.');
        }
    }

    /**
     * Render the task summary dashboard
     * Shows completion statistics and user contributions
     */
    async renderTaskSummary() {
        const summaryContainer = document.getElementById('taskSummary');
        const totalTasks = this.todayTasks.length;
        const completedTasks = this.completedTasks.length;
        const remainingTasks = totalTasks - completedTasks;
        
        // Get total stored completion logs count
        let totalStoredCompletions = 0;
        try {
            totalStoredCompletions = await this.getCompletionLogsCount();
        } catch (error) {
            console.error('Failed to get completion logs count:', error);
        }
        
        // Group completions by user
        const userCompletions = {};
        this.completedTasks.forEach(completion => {
            if (!userCompletions[completion.user_name]) {
                userCompletions[completion.user_name] = 0;
            }
            userCompletions[completion.user_name]++;
        });
        
        let userSummary = '';
        if (Object.keys(userCompletions).length > 0) {
            const userEntries = Object.entries(userCompletions)
                .map(([user, count]) => `${user}: ${count}`)
                .join(', ');
            userSummary = `<div class="user-contributions">Contributions: ${userEntries}</div>`;
        }
        
        // Add data storage info
        let dataStorageInfo = '';
        if (totalStoredCompletions > 0) {
            dataStorageInfo = `
                <div class="data-storage-info">
                    <span class="storage-label">📊 Local Storage:</span>
                    <span class="storage-count">${totalStoredCompletions} completion records</span>
                    <span class="storage-note">(Export CSV to clear)</span>
                </div>
            `;
        }
        
        summaryContainer.innerHTML = `
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-number">${completedTasks}</span>
                    <span class="stat-label">Completed</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${remainingTasks}</span>
                    <span class="stat-label">Remaining</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${totalTasks}</span>
                    <span class="stat-label">Total</span>
                </div>
            </div>
            ${userSummary}
            ${dataStorageInfo}
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FoodRecoveryBuddy();
});
