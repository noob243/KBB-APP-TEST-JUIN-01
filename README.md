# KBB App - Application de Gestion de Cabinet d'Avocats

Bienvenue sur le dépôt de KBB App, une application moderne conçue pour la gestion complète d'un cabinet d'avocats.

Cette application est développée avec React (Vite), TypeScript, et Tailwind CSS pour le front-end, et utilise Supabase pour la base de données en temps réel. Elle est également encapsulée avec Capacitor pour générer des applications natives pour Android et iOS.

## ✨ Fonctionnalités

- **Gestion Complète :** Clients, dossiers, tâches, événements, facturation, et plus encore.
- **Base de Données en Temps Réel :** Synchronisation instantanée des données grâce à Supabase.
- **Multiplateforme :** Fonctionne sur le web, Android et iOS.
- **Interface Moderne :** Design épuré et réactif avec des icônes professionnelles.
- **Authentification Sécurisée :** Gestion des accès via Supabase Auth.
- **Notifications :** Rappels de tâches et d'événements.
- **Mode Sombre :** Interface adaptable pour le confort visuel.

## 🚀 Démarrage et Déploiement

### 1. **Prérequis**

- **Node.js** (LTS) et **npm**
- **Android Studio** (pour la génération de l'APK Android)
- **Xcode** (pour la génération de l'archive iOS)
- Un compte **Vercel** pour le déploiement web.
- Un compte **GitHub** pour le versioning.

### 2. **Installation**

Clonez le dépôt et installez les dépendances :

```bash
git clone https://github.com/noob243/KBB-APP-TEST-JUIN-01.git
cd KBB-APP-TEST-JUIN-01
npm install
```

### 3. **Configuration de Supabase**

Créez un fichier `.env` à la racine du projet et ajoutez-y vos clés Supabase :

```
VITE_SUPABASE_URL=VOTRE_URL_SUPABASE
VITE_SUPABASE_ANON_KEY=VOTRE_CLE_ANON_SUPABASE
```

### 4. **Développement Local**

Pour lancer l'application en mode développement sur votre navigateur :

```bash
npm run dev
```

## 📦 Déploiement sur Vercel

Ce projet est configuré pour un déploiement "push-to-deploy" avec Vercel.

1.  **Poussez votre code sur GitHub :**
    ```bash
    git add .
    git commit -m "Décrivez vos modifications"
    git push origin main
    ```

2.  **Importez votre projet sur Vercel :**
    - Connectez-vous à votre compte Vercel.
    - Créez un nouveau projet et sélectionnez votre dépôt GitHub.
    - Vercel détectera automatiquement qu'il s'agit d'un projet Vite.
    - **Important :** Allez dans les paramètres du projet sur Vercel, section "Environment Variables", et ajoutez vos clés `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

Vercel déploiera automatiquement chaque nouvelle version poussée sur la branche `main`.

## 📱 Génération des Applications Mobiles

### Android (.apk)

1.  **Build de l'application web :**
    ```bash
    npm run build
    ```

2.  **Synchroniser avec Capacitor :**
    ```bash
    npx cap sync
    ```

3.  **Ouvrir dans Android Studio :**
    ```bash
    npx cap open android
    ```

4.  **Générer l'APK :**
    - Dans Android Studio, allez dans le menu `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
    - Une fois la génération terminée, vous trouverez le fichier `app-debug.apk` dans le dossier `android/app/build/outputs/apk/debug`.

### iOS (.ipa) - *Nécessite un Mac*

1.  **Build et synchronisation :**
    ```bash
    npm run build
    npx cap sync
    ```

2.  **Ouvrir dans Xcode :**
    ```bash
    npx cap open ios
    ```

3.  **Configuration dans Xcode :**
    - Sélectionnez votre appareil de destination (simulateur ou iPhone connecté).
    - Dans l'onglet `Signing & Capabilities`, configurez votre compte de développeur Apple.

4.  **Archiver l'application :**
    - Dans le menu, allez à `Product` > `Archive`.
    - Une fois l'archivage terminé, l'organisateur s'ouvrira. Vous pourrez y distribuer l'application (pour TestFlight ou l'App Store), ce qui générera le fichier `.ipa`.
