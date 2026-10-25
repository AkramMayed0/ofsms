# OFSMS Android app (APK)

The APK is a thin Capacitor shell that opens the deployed OFSMS web app, so web
updates reach the app without rebuilding it.

Build it from GitHub: **Actions → Build Android APK → Run workflow**, enter the
deployed site URL (e.g. `https://your-app.vercel.app`), then download the
`ofsms-apk` artifact from the finished run and install `app-debug.apk`
(allow "install unknown apps" on the phone).
