# HomeHub – Custom Calendar

This update replaces the white Google Calendar embed with a custom dark HomeHub calendar.

## New calendar features

- Fully dark design matching HomeHub
- Monday-first month layout
- Previous month, next month and Today controls
- Google Calendar event colours
- Times shown inside each day
- Multi-day and all-day events
- Automatic refresh every five minutes
- No Google branding or white iframe

## Required one-time Apps Script update

The calendar needs the API to return all events for the visible six-week range.

1. Open your **HomeHub Calendar** project at script.google.com.
2. Open `google-apps-script/Code.gs` from this ZIP.
3. Replace all existing Apps Script code with this file.
4. Save the project.
5. Click **Deploy → Manage deployments**.
6. Edit the existing Web app deployment.
7. Select **New version**.
8. Click **Deploy**.

Keep the existing `/exec` URL. It is already configured in HomeHub.

## Upload to GitHub

Upload and replace:

- index.html
- styles.css
- app.js
- config.js
- README.md

The `google-apps-script` folder is for Apps Script and does not need to be uploaded to GitHub.

After GitHub Pages deploys, use Ctrl+F5 on a computer or fully reopen the Chromecast browser.
