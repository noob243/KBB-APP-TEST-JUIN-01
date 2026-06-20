Capacitor Build & Mobile Packaging

Pré-requis (Windows / Android):
- Node.js LTS + npm
- Android Studio + Android SDK

Pré-requis (iOS):
- macOS avec Xcode (ou un service CI macOS)

Étapes locales (Android):

1) Installer dépendances

```bash
npm install
```

2) Initialiser Capacitor (si pas fait)

```bash
npx cap init kbb-app com.example.kbbapp
```

3) Ajouter Android

```bash
npx cap add android
```

4) Build web & sync

```bash
npm run build:web
npx cap sync
```

5) Ouvrir Android Studio

```bash
npx cap open android
```

Puis générez l'APK via Android Studio ou en ligne de commande:

```bash
cd android
./gradlew assembleRelease
```

iOS (macOS requis) — rapide

```bash
npx cap add ios
npm run build:web
npx cap sync ios
npx cap open ios
# puis archive/build via Xcode
```

CI pour iOS
- Utiliser GitHub Actions / Codemagic / Bitrise pour automatiser le build sur macOS avec certificats et provisioning profiles.
- Voir `.github/workflows/ios-build.yml` (template fourni).
