# Build APK helper (Windows PowerShell)
# Usage: run after npm install and after running npx cap add android
# From project root:
#   ./scripts/build-apk.ps1

Write-Host "Building web (production) and syncing Capacitor..."
npm run build:web
if ($LASTEXITCODE -ne 0) { Write-Host "npm build failed" -ForegroundColor Red; exit 1 }

npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "npx cap sync failed" -ForegroundColor Yellow }

Write-Host "Launching Gradle assembleRelease... (requires Android SDK + JDK + gradle wrapper)"
cd android
if (Test-Path .\gradlew.bat) {
    .\gradlew.bat assembleRelease
} elseif (Test-Path ./gradlew) {
    ./gradlew assembleRelease
} else {
    Write-Host "gradlew not found. Open Android Studio: npx cap open android" -ForegroundColor Yellow
}
