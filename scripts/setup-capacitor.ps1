# Setup Capacitor (Windows PowerShell)
# Usage: Ouvrir PowerShell en tant qu'administrateur et exécuter:
#   ./scripts/setup-capacitor.ps1

# 1) Vérifier Node.js et npm
Write-Host "Vérification de Node.js et npm..."
node -v
npm -v

if ($LASTEXITCODE -ne 0) {
    Write-Host "Node/npm introuvable. Installez Node.js LTS depuis https://nodejs.org/ puis relancez ce script." -ForegroundColor Red
    exit 1
}

# 2) Installer les dépendances
Write-Host "Installation des dépendances npm..."
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install a échoué." -ForegroundColor Red; exit 1 }

# 3) Initialiser Capacitor (si non initialisé)
Write-Host "Initialisation de Capacitor (si nécessaire)..."
# Le projet contient déjà capacitor.config.json ; npx cap init refusera si déjà initialisé, mais c'est sans danger.
npx cap init kbb-app com.example.kbbapp || Write-Host "cap init skipped or failed (may already exist)" -ForegroundColor Yellow

# 4) Ajouter la plateforme Android
Write-Host "Ajout de la plateforme Android (peut prendre du temps)..."
npx cap add android || Write-Host "cap add android failed (maybe already added)" -ForegroundColor Yellow

# 5) Build web + sync
Write-Host "Build de l'app web (production) puis synchronisation vers les plateformes natives..."
npm run build:web
if ($LASTEXITCODE -ne 0) { Write-Host "Build web échoué." -ForegroundColor Red; exit 1 }

npx cap sync

Write-Host "Opérations terminées. Ouvrez Android Studio avec: npx cap open android" -ForegroundColor Green
Write-Host "Pour iOS: exécuter 'npx cap open ios' depuis macOS avec Xcode installé." -ForegroundColor Yellow
