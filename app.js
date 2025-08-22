class FoodRecoveryBuddy {
    constructor() {
        this.db = null;
        this.currentUser = null;
        this.todayTasks = [];
        this.completedTasks = [];
        this.config = null;
        
        this.init();
    }

    async init() {
        await this.loadConfig();
        await this.initDatabase();
        this.setupEventListeners();
        this.updateDateDisplay();
        this.loadTodayData();
        this.renderUserSelection();
    }

    async loadConfig() {
        try {
            const response = await fetch('data/config.json');
            this.config = await response.json();
        } catch (error) {
            console.error('Failed to load config:', error);
            // Fallback config
            this.config = {
                users: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
                tasks: []
            };
        }
    }

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
                
                // Create completion logs store
                if (!db.objectStoreNames.contains('completionLogs')) {
                    const completionStore = db.createObjectStore('completionLogs', { keyPath: 'id', autoIncrement: true });
                    completionStore.createIndex('timestamp', 'timestamp', { unique: false });
                    completionStore.createIndex('date', 'date', { unique: false });
                    completionStore.createIndex('user_name', 'user_name', { unique: false });
                }
                
                // Create daily data store
                if (!db.objectStoreNames.contains('dailyData')) {
                    const dailyStore = db.createObjectStore('dailyData', { keyPath: 'date' });
                }
            };
        });
    }

    setupEventListeners() {
        // User selection
        document.getElementById('userGrid').addEventListener('click', (e) => {
            if (e.target.classList.contains('user-btn')) {
                this.selectUser(e.target.textContent);
            }
        });

        // Task completion
        document.getElementById('taskContainer').addEventListener('click', (e) => {
            if (e.target.closest('.task-item')) {
                const taskItem = e.target.closest('.task-item');
                const taskId = taskItem.dataset.taskId;
                this.toggleTaskCompletion(taskId);
            }
        });

        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // Close modal when clicking outside
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                this.closeTaskModal();
            }
        });

        // Action buttons
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveAndComplete());
        document.getElementById('newDayBtn').addEventListener('click', () => this.startNewDay());

        // Task item click for details
        document.getElementById('taskContainer').addEventListener('click', (e) => {
            if (e.target.closest('.task-item')) {
                const taskItem = e.target.closest('.task-item');
                const taskId = taskItem.dataset.taskId;
                this.showTaskDetails(taskId);
            }
        });
    }

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

    getTodayTasks() {
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'lowercase' });
        
        return this.config.tasks
            .filter(task => task.day_of_week.includes(dayName))
            .sort((a, b) => a.order_sequencer - b.order_sequencer);
    }

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

    selectUser(userName) {
        this.currentUser = userName;
        this.todayTasks = this.getTodayTasks();
        this.loadTodayData();
        
        document.getElementById('userSelection').classList.add('hidden');
        document.getElementById('taskList').classList.remove('hidden');
        
        this.renderTasks();
    }

    async loadTodayData() {
        const today = this.getTodayDateString();
        const dailyData = await this.getDailyData(today);
        
        if (dailyData) {
            this.completedTasks = dailyData.completedTasks || [];
        } else {
            this.completedTasks = [];
        }
    }

    renderTasks() {
        const taskContainer = document.getElementById('taskContainer');
        taskContainer.innerHTML = '';
        
        this.todayTasks.forEach(task => {
            const isCompleted = this.completedTasks.some(ct => ct.task_id === task.id);
            
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${isCompleted ? 'completed' : ''}`;
            taskElement.dataset.taskId = task.id;
            
            taskElement.innerHTML = `
                <div class="task-name">${task.task}</div>
                <div class="task-explanation">${task.explanation}</div>
            `;
            
            taskContainer.appendChild(taskElement);
        });
    }

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
        
        this.renderTasks();
    }

    showTaskDetails(taskId) {
        const task = this.todayTasks.find(t => t.id === taskId);
        if (!task) return;
        
        document.getElementById('modalTaskName').textContent = task.task;
        document.getElementById('modalTaskExplanation').textContent = task.explanation;
        document.getElementById('taskModal').classList.remove('hidden');
    }

    closeTaskModal() {
        document.getElementById('taskModal').classList.add('hidden');
    }

    async saveAndComplete() {
        if (this.completedTasks.length === 0) {
            alert('Please complete at least one task before saving.');
            return;
        }
        
        try {
            // Save to IndexedDB
            await this.saveDailyData();
            await this.saveCompletionLogs();
            
            // Show completion summary
            this.showCompletionSummary();
            
        } catch (error) {
            console.error('Failed to save data:', error);
            alert('Failed to save data. Please try again.');
        }
    }

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

    async saveCompletionLogs() {
        const promises = this.completedTasks.map(completion => {
            return this.addCompletionLog(completion);
        });
        
        return Promise.all(promises);
    }

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

    startNewDay() {
        this.currentUser = null;
        this.completedTasks = [];
        
        document.getElementById('completionSummary').classList.add('hidden');
        document.getElementById('userSelection').classList.remove('hidden');
        
        this.updateDateDisplay();
    }

    async exportToCSV() {
        if (this.completedTasks.length === 0) {
            alert('No completed tasks to export.');
            return;
        }
        
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
    }

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

    getTodayDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // IndexedDB helper methods
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FoodRecoveryBuddy();
});
