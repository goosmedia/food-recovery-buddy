# Daily Task Logger with Microsoft Graph (M365)  

This document describes how a GitHub Pages–hosted **PWA** can log task completions (task, user, timestamp) into an **Excel workbook** stored in **OneDrive for Business** or **SharePoint**, using **Microsoft Graph API**.  

---

## 0) Pick Storage Target  
- **OneDrive for Business** → simpler, single owner.  
- **SharePoint** → shared ownership for teams.  

---

## 1) Azure AD (Entra ID) App Registration  
1. Go to **App registrations** → **New registration**.  
2. Choose **Single tenant**.  
3. Redirect URI: add your GitHub Pages URL, e.g. https://.github.io//auth-callback
4. Configure platform as **SPA**.  
5. Use **Auth Code + PKCE** (do not enable implicit flow).  

---

## 2) Permissions & Consent  
1. Required Microsoft Graph delegated permissions:  
- `User.Read`, `openid`, `profile`, `offline_access`  
- If **OneDrive**: `Files.ReadWrite`  
- If **SharePoint**: `Sites.ReadWrite.All`, `Files.ReadWrite`  
2. Admin grants consent once for the tenant.  

---

## 3) Workbook & Table  
1. Create workbook `DailyTaskLog.xlsx`.  
2. Add worksheet `Log` with a **Table** named `Tasks`.  
3. Columns:  
- `timestamp` (UTC ISO-8601)  
- `taskTitle`  
- `details`  
- `users` (comma-separated)  
- `dayOfWeek`  
- `uuid` (client-generated)  
- `deviceId` (optional)  
- `excelRowId` (for local cache)  

---

## 4) First-Run Authentication (Tablet)  
1. Use **MSAL Browser** with **Auth Code + PKCE** and `loginRedirect`.  
2. User signs in → redirected to Microsoft login → returned to `auth-callback`.  
3. MSAL stores tokens securely in **IndexedDB** (preferred) or `localStorage`.  

---

## 5) Token Acquisition & Refresh  
- Use **acquireTokenSilent** for background refresh.  
- Tokens stay in MSAL cache.  
- On failure, fall back to `loginRedirect`.  

---

## 6) Writing Log Entries  
1. Ensure valid access token.  
2. Append rows to Excel table:  

**OneDrive**  
`POST /me/drive/items/{itemId}/workbook/tables(‘Tasks’)/rows/add`


**SharePoint**  
`POST /sites/{siteId}/drives/{driveId}/items/{itemId}/workbook/tables(‘Tasks’)/rows/add`

3. Payload example:  
```json
{
  "values": [[
    "2025-08-15T06:30:21Z",
    "Dishwasher",
    "—",
    "Alex,Jamie",
    "Friday",
    "b1e2…-uuid",
    "tablet01",
    ""
  ]]
}

```
4.	Save returned rowId to local cache.


## 7) Undo a Completion
 Look up excelRowId (cached) → delete row:
`POST .../workbook/tables('Tasks')/rows/{index}/delete`
	•	If not possible, append an UNDO event row instead.

## 8) Offline Behavior & Sync
	1.	Queue unsynced events in IndexedDB.
	2.	Flush when online, marking each as synced.
	3.	Use uuid column to ensure no duplicates.

⸻

## 9) Security Hardening
	•	Use tenant-specific authority:
`https://login.microsoftonline.com/<tenantId>/`
	•	Serve over HTTPS (default GitHub Pages).
	•	Keep scopes minimal.
	•	Optionally encrypt MSAL cache with WebCrypto.
	•	Provide a logout function (MSAL logoutRedirect).

⸻

## 10) Operational Notes
	•	Midnight reset is local only (UI clears daily, log persists).
	•	Config files (tasks.json, users.json) are static assets, loaded at runtime.
	•	Include a health check for token + workbook reachability.
	•	Handle timezones: log UTC always, optionally local date too.

⸻

## 11) Minimal Scope Sets

OneDrive
```
User.Read
offline_access
Files.ReadWrite
openid
profile
```

SharePoint
```
User.Read
offline_access
Files.ReadWrite
Sites.ReadWrite.All
openid
profile
```

## 12) Failure Handling
	•	401/interaction_required → re-login via loginRedirect.
	•	429/5xx → retry with backoff, queue offline.
	•	Workbook renamed/moved → resolve by path, update stored IDs.
