# Program Description  
A **PWA-based daily task manager** designed for shared household or team use on a tablet. It presents a dynamic task list that refreshes daily at midnight, based on a JSON config file defining recurring (daily) and day-specific tasks. Tasks have a title and optional details. Users mark tasks as completed by selecting one or more names from a predefined user list. Completion is logged with timestamp and user(s). Logs persist permanently in a backend (Google Sheets API or M365 equivalent). Tasks reset each day but history remains accessible outside the app.  

---

# Requirements  

## Tasks  
- Defined in a `tasks.json` config file.  
- Fields:  
  - `title` (string, required)  
  - `details` (string, optional)  
  - `repeat` (enum: `daily` or `[days of week]`)  
- Tasks displayed in defined order; no enforced sequencing.  
- When completed, task stays visible but shown as crossed out (or visually “done”).  
- Undo option available.  

## Users  
- Defined in separate `users.json`.  
- Fixed list of names, editable outside app.  
- No authentication; names are just selectable labels.  

## Daily Reset  
- Automatic reset at midnight local time.  
- No carryover of incomplete tasks.  

## Logging  
- Each completion event logged with:  
  - Task title  
  - User(s)  
  - Timestamp (date + time)  
- Undo removes associated log entry.  
- Log storage: external backend (Google Sheets API or M365 option).  
- Logs must be permanent and exportable (CSV/JSON).  
- No end-user UI for browsing; raw data is sufficient.  

## Storage & Privacy  
- App hosted on GitHub Pages (static).  
- Data persistence handled via backend (Google Sheets or M365).  
- Local config files (`tasks.json`, `users.json`) fetched at runtime.  
- Ensure that logs are private but accessible to designated maintainers.  

## UI/UX  
- Mobile-first, tablet-optimized layout.  
- Each day’s tasks listed with checkable/clickable completion toggle.  
- Completed tasks shown as crossed out.  
- Small info icon or expander for optional task details.  
- User(s) can be selected before or after marking complete.  
- Undo button available on completed tasks.  

## Platform  
- Progressive Web App (PWA).  
- Installable on tablet, offline-first where possible.  
- Online sync required for logging.  
