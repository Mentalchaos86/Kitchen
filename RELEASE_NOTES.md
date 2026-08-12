# HomeHub OS v1.7.5 — Predict Stability Fix

This release fixes the all-screen Loading state introduced around Sprint 5.

The key architecture change is a bootstrap failsafe:
the proven dashboard starts first; Morning Brief loads afterwards as an optional feature.

If Morning Brief ever fails, HomeHub itself keeps running.

GitHub: upload everything except `google-apps-script/`.
Google Apps Script: no changes.
Android TV: no APK update.
Rollback: `HomeHub-OS-v1.7.3-Predict-Sprint4.zip`.
