# Food Recovery Buddy - Daily Task Logger

A **Progressive Web App (PWA)** for logging daily food recovery tasks without requiring immediate authentication. Built for teams who need to track task completion quickly and efficiently.

## 🚀 Quick Start

### Local Development
1. Clone this repository
2. Navigate to the project directory
3. Start the development server:
   ```bash
   npm start
   # or
   python3 -m http.server 8000
   ```
4. Open your browser to `http://localhost:8000`

### Usage
1. **Select User**: Choose your name from the grid
2. **View Tasks**: See today's tasks (daily + weekly tasks for today)
3. **Complete Tasks**: Tap tasks to mark them as complete
4. **View Summary**: See completion overview and export options
5. **Download CSV**: Export your data and clear local storage
6. **Continue Working**: Return to tasks or switch users

## 📱 User Guide

### Daily Workflow
- **Open App**: App automatically shows today's date and available tasks
- **Select User**: Choose your name from the user grid
- **Complete Tasks**: Tap any task to mark it complete (shows checkmark and your name)
- **Switch Users**: Use the bottom bar to quickly switch between team members
- **View Progress**: See completion statistics and user contributions
- **Export Data**: Download CSV with all completed tasks

### Task Types
- **Daily Tasks**: Available every day (e.g., temperature logging, food sorting)
- **Weekly Tasks**: Specific days (e.g., Monday inventory, Wednesday deep cleaning)
- **Automatic Filtering**: App shows only relevant tasks for today

### User Management
- **Quick Switching**: Bottom bar shows current user and allows instant switching
- **State Preservation**: Task completion state maintained across user switches
- **Team Collaboration**: Multiple users can contribute to the same task list

### Data Export
- **CSV Download**: Export all completed tasks with timestamps and user attribution
- **Automatic Cleanup**: Local storage cleared after successful export
- **Data Safety**: Export must complete successfully before cleanup

## ⚙️ Configuration

### config.json Structure
The app configuration is stored in `data/config.json`:

```json
{
  "users": ["Alice", "Bob", "Charlie", "Diana", "Eve"],
  "adminPin": "7778",
  "tasks": [
    {
      "id": "daily-100",
      "task": "Task Name",
      "explanation": "Task description",
      "day_of_week": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      "order_sequencer": 100
    }
  ]
}
```

### Adding/Modifying Tasks
1. **Edit config.json**: Modify the tasks array
2. **Task IDs**: Use spaced numbering (100, 200, 300) for easy insertion
3. **Day Assignment**: Set `day_of_week` array for task availability
4. **Priority Order**: Use `order_sequencer` for display order

### User Management
- **Add Users**: Add names to the `users` array
- **Remove Users**: Remove names from the array
- **Admin PIN**: Change `adminPin` for reset functionality

### Task Configuration
- **Daily Tasks**: Include all 7 days in `day_of_week`
- **Weekly Tasks**: Include specific days only
- **Descriptions**: Keep explanations clear and concise
- **Sequencing**: Use logical order numbers for priority

## 🔒 Security Features

### Admin PIN Protection
- **Reset Function**: Requires admin PIN (default: 7778)
- **Configurable**: Change PIN in config.json
- **Double Confirmation**: PIN verification + final warning

### Data Safety
- **Local Storage**: Data stored in device's IndexedDB
- **Export Required**: CSV download before data cleanup
- **No Data Loss**: Export must succeed before cleanup

## 📊 Features

- **Touch-Friendly**: Large buttons optimized for tablets and phones
- **Offline First**: Works without internet connection
- **Local Storage**: Data stored securely in your device
- **Daily Tasks**: Automatically shows relevant tasks for each day
- **CSV Export**: Download your completion data
- **PWA Ready**: Install on home screen for easy access
- **User Switching**: Quick user changes without losing progress
- **Progress Tracking**: Visual completion indicators and statistics

## 🎯 Success Metrics

**MVP Success:**
- Users can complete tasks in <30 seconds
- Zero data loss during normal operation
- Works on tablets and phones
- No authentication friction for daily use

**Future Success:**
- Seamless cloud sync
- Rich reporting capabilities
- Team collaboration features
- Data insights and analytics

---

## 💻 Technical Reference

### Architecture Overview
- **Frontend**: Vanilla HTML/CSS/JavaScript (ES6+)
- **Storage**: IndexedDB with two stores (dailyData, completionLogs)
- **PWA**: Service worker, manifest, offline capability
- **Data Flow**: Local-first with optional CSV export

### Core Components

#### FoodRecoveryBuddy Class
- **Main Application**: Handles all app logic and state
- **Data Management**: IndexedDB operations and data persistence
- **UI Rendering**: Dynamic task and user interface updates
- **Event Handling**: User interactions and navigation

#### Data Stores
- **dailyData**: Current day's completion state (keyed by date)
- **completionLogs**: All task completion records (auto-incrementing IDs)
- **Data Lifecycle**: Created on task completion, cleared after CSV export

#### Task System
- **Dynamic Filtering**: Tasks filtered by current day of week
- **Priority Ordering**: Sorted by order_sequencer value
- **Completion Tracking**: User attribution and timestamps
- **State Persistence**: Immediate IndexedDB saves

### Key Methods

#### Initialization
- `init()`: App startup and configuration loading
- `initDatabase()`: IndexedDB setup and schema creation
- `loadConfig()`: Configuration loading with fallback

#### User Management
- `selectUser()`: User selection and task loading
- `switchToUser()`: Quick user switching
- `renderBottomQuickUserSwitcher()`: Bottom bar user interface

#### Task Operations
- `toggleTaskCompletion()`: Mark tasks complete/incomplete
- `renderTasks()`: Display task list with completion status
- `getTodayTasks()`: Filter tasks for current day

#### Data Management
- `saveDailyData()`: Persist current day's state
- `exportToCSV()`: Generate and download completion data
- `clearCompletionLogs()`: Clean up after export

### PWA Features
- **Service Worker**: Offline caching and background sync
- **Manifest**: App installation and home screen integration
- **Responsive Design**: Tablet and mobile optimization
- **Touch Interface**: Large touch targets and gesture support

### Data Persistence Strategy
- **Immediate Saves**: Task completions saved instantly
- **Daily Aggregation**: Current day data stored separately
- **Export Cleanup**: Completion logs cleared after CSV download
- **Fallback Handling**: Graceful degradation if storage fails

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Support**: iOS Safari, Chrome Mobile, Samsung Internet
- **Tablet Optimized**: Touch interface and responsive layout
- **PWA Support**: Service worker and manifest compatibility

### Performance Considerations
- **Minimal Dependencies**: No external libraries or frameworks
- **Efficient Rendering**: DOM updates only when necessary
- **Storage Optimization**: IndexedDB with proper indexing
- **Memory Management**: Regular cleanup of old data

### Security Implementation
- **Admin PIN**: Configurable PIN for destructive operations
- **Data Validation**: Input sanitization and validation
- **Local Storage**: No external data transmission
- **User Isolation**: Task completion attribution

### Future Development Path
- **Phase 2**: Microsoft Lists integration and cloud sync
- **Phase 3**: Power BI reporting and advanced analytics
- **Admin Panel**: Web-based configuration interface
- **API Integration**: RESTful endpoints for external systems

---

*Built for teams who need to track daily tasks without the overhead of complex authentication systems.*
