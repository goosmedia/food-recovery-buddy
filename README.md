git# Food Recovery Buddy - Daily Task Logger

A **Progressive Web App (PWA)** for logging daily food recovery tasks without requiring immediate authentication. Built for teams who need to track task completion quickly and efficiently.

## 🤔 What This App Does

**Daily Task Management:**
- Display today's tasks in sequence order
- Two-tap task completion logging
- Local-first data storage (works offline)
- Optional cloud sync to Microsoft 365

**User Experience:**
- No login required for daily use
- Touch-friendly interface for tablets/phones
- Simple: touch select name → touch recently completed task →   repeat for each task → done and save/upload
- Works 7 days a week with daily task lists
- Lists all daily tasks and whichever weekly tast lands today

## 🏗️ Architecture Philosophy

**Local-First Design:**
- Tasks logged immediately to device storage
- No data loss if device loses power
- Works completely offline
- Sync to cloud only when convenient

**Simple Authentication:**
- Microsoft 365 sign-in only for data upload/sync
- No daily authentication required
- Users just work, data syncs in background

## 📦 Data Structure

**Tasks:**
```
- id: unique identifier
- task: task name
- explanation: detailed description  
- day_of_week: which days this task appears
- order_sequencer: priority/display order
```

**Completion Logs:**
```
- timestamp: when completed
- user_name: who did it
- task_id: which task
- completed_at: local time
```

## 🚀 Development Phases

### Phase 1: MVP ✅ COMPLETED
- [x] Basic HTML/CSS/JS structure
- [x] Task list display
- [x] User name selection (touch-friendly)
- [x] Task completion logging
- [x] Local storage (IndexedDB)
- [x] PWA setup with offline capability
- [x] CSV export functionality

### Phase 2: Cloud Integration
- [ ] Microsoft Lists (SharePoint) setup
- [ ] Background sync capability
- [ ] End-of-day data upload
- [ ] Data consolidation logic

### Phase 3: Reporting & Polish
- [ ] Microsoft Power BI integration
- [ ] Advanced analytics
- [ ] Task management interface
- [ ] User management
- [ ] Data backup/snapshot system

## 🛠️ Technical Stack

**Frontend:**
- Vanilla HTML/CSS/JavaScript
- Progressive Web App (PWA)
- Local storage (IndexedDB)
- Service worker for offline support

**Future Backend:**
- Microsoft Lists (SharePoint)
- Microsoft Graph API (minimal scope)
- Power BI for reporting

## 🎨 UI/UX Principles

**Touch-First Design:**
- Large, easy-to-tap buttons
- Clear visual hierarchy
- Minimal cognitive load
- Works on any device size

**Daily Workflow:**
1. User opens app
2. Selects their name (one tap)
3. Sees today's tasks
4. Taps completed tasks
5. Data saved locally
6. Optional cloud sync later

## 🔒 Security & Privacy

**Local Data:**
- Stored in device's IndexedDB
- No external data transmission during daily use
- User controls when data leaves device

**Cloud Sync:**
- Microsoft 365 tenant integration
- Minimal required permissions
- Data uploaded only when explicitly requested

## 💻 PWA Features

- **Offline First:** Works without internet
- **Installable:** Add to home screen
- **Responsive:** Adapts to any device
- **Fast:** Instant task logging
- **Reliable:** No network dependencies for core functionality

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

## 💡 Key Insights for Future Development

**Remember:** This is a **local-first app** that occasionally syncs to the cloud, not a cloud-dependent app that requires constant authentication.

**User Experience Priority:** Speed and simplicity over features. Users should be able to log a task completion in under 30 seconds.

**Data Strategy:** Local storage for immediate needs, cloud sync for backup and reporting. Never lose user data due to network issues.

**Microsoft Integration:** Use Microsoft Lists (SharePoint) instead of complex Excel workbooks. Much simpler API and better suited for this use case.

**Touch Interface:** Design for fingers, not mice. Large buttons, clear visual feedback, minimal scrolling.

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
4. **Save & Export**: Save your progress and optionally export to CSV
5. **Start New Day**: Begin fresh for the next day

### Features
- **Touch-Friendly**: Large buttons optimized for tablets and phones
- **Offline First**: Works without internet connection
- **Local Storage**: Data stored securely in your device
- **Daily Tasks**: Automatically shows relevant tasks for each day
- **CSV Export**: Download your completion data
- **PWA Ready**: Install on home screen for easy access

---

*Built for teams who need to track daily tasks without the overhead of complex authentication systems.*
