# HomeHub Module: Today & Calendar

This update replaces the shopping list with a live **Today** agenda from Google Calendar.

## What it displays

- Today’s appointments
- Start times
- All-day events
- Event locations, when available
- The next upcoming appointment
- The existing monthly Google Calendar

## Why Google Apps Script is used

The HomeHub is hosted publicly on GitHub Pages. Connecting it directly to a private Google Calendar with browser OAuth would require regular sign-ins and token handling on the Chromecast.

The included Google Apps Script runs under your Google account and returns a small read-only agenda feed. Google documents that Apps Script web apps can execute as the script owner, and its Calendar service can retrieve events occurring on a given day.

## One-time Google setup

### 1. Create the script

1. Open `https://script.google.com` in your browser.
2. Click **New project**.
3. Rename it to `HomeHub Calendar`.
4. Delete the sample code.
5. Open `google-apps-script/Code.gs` from this download.
6. Copy all of it into the Apps Script editor.
7. Click **Save**.

### 2. Deploy it

1. Click **Deploy** in the top-right.
2. Choose **New deployment**.
3. Click the gear and choose **Web app**.
4. Set **Execute as** to `Me`.
5. Set **Who has access** to `Anyone`.
6. Click **Deploy**.
7. Google will ask you to authorize Calendar access.
8. Copy the resulting URL ending in `/exec`.

### 3. Add the URL to HomeHub

Open `config.js` and paste the URL here:

```js
agendaApiUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
```

### 4. Upload HomeHub

Upload these dashboard files to the root of the existing GitHub repository:

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `README.md`

Do not upload the `google-apps-script` folder to GitHub unless you want it stored there. Its `Code.gs` file belongs in Google Apps Script.

## Privacy note

Deploying as **Anyone** means a person who obtains the long Apps Script URL could read the limited event data returned by this script. It returns only event title, time, all-day status and location. It does not return descriptions, guests or notes.

For stronger privacy later, the alternative is full Google OAuth on the Chromecast, but that introduces sign-in and token-expiry friction.


## Calendar API connected

The Google Apps Script web-app URL is already included in `config.js`.
No additional API configuration is required for this version.


## Fixed build

This build removes an obsolete shopping-list startup call that prevented the
clock, countdown, weather, RSS and Bitcoin widgets from loading after the
shopping panel was replaced by Today.
