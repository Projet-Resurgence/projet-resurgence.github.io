# Projet Résurgence - Site Web Officiel

Site web officiel du serveur Discord RP géopolitique francophone **Projet Résurgence**.

## 🌍 Aperçu

Ce site présente le serveur Discord **Projet Résurgence**, une communauté de roleplay géopolitique francophone dans un univers post-apocalyptique. Les joueurs incarnent des forces émergentes (États, mouvements, idéologies) et participent à la reconstruction d'un monde où tout est à rebâtir.

## ✨ Fonctionnalités du Site

### 🎨 Design & Interface
- **Thème Adaptatif** : Mode clair/sombre avec persistance locale
- **Design Responsive** : Optimisé pour desktop, tablette et mobile
- **Animations Fluides** : Effets de transition et animations au scroll
- **Palette de Couleurs** : Basée sur l'identité visuelle (#D5B654, blanc, noir)

### 🚀 Technologie
- **HTML5 Sémantique** : Structure accessible et SEO-friendly
- **CSS Variables** : Système de thème modulaire et maintenable
- **JavaScript Vanilla** : Fonctionnalités interactives sans dépendances
- **PWA Ready** : Service Worker et Manifest pour installation

### 📱 Progressive Web App
- **Installation** : Peut être installée comme une app native
- **Mode Hors-ligne** : Fonctionne sans connexion internet
- **Performance** : Cache intelligent des ressources

## 🏗️ Structure du Projet

```
resurgence-web/
├── index.html              # Page principale
├── regles.html             # Règles et règlement
├── guide.html              # Guide du débutant
├── manifest.json           # Manifest PWA
├── sw.js                   # Service Worker
├── styles/
│   ├── main.css            # Styles principaux avec thème
│   └── main.js             # JavaScript principal
├── images/
│   ├── final_logo_little.png     # Logo principal
│   ├── final_logo_centered.png # Logo centré
│   └── banner.jpg          # Bannière
└── README.md               # Documentation
```

## 🎯 Pages du Site

### 🏠 Accueil (index.html)
- **Hero Section** : Présentation du serveur avec description immersive
- **Le Serveur** : Ce qui attend les joueurs (gouvernance, économie, conflits, territoires)
- **Univers** : Description de l'univers post-apocalyptique et de la communauté
- **Statistiques** : Chiffres du serveur et de la communauté
- **CTA** : Appels à l'action vers Discord

### 📋 Règles (regles.html)
- **Catégories** : Navigation par type de règles
- **Règles Générales** : Respect, communication, sanctions
- **Roleplay** : Directives pour le RP et création de nations
- **Militaire & Conflits** : Règles de guerre et diplomatie
- **Territorial** : Gestion des territoires et frontières
- **HRP** : Règles hors roleplay

### 📖 Guide (guide.html)
- **Démarrage Rapide** : 5 étapes pour commencer
- **Guides Détaillés** : Création de nation, économie, RP
- **FAQ** : Réponses aux questions fréquentes
- **Tutoriels** : Comment utiliser le bot et les systèmes

## 🛠️ Personnalisation

### Variables CSS Principales
```css
:root {
  --primary-gold: #D5B654;     /* Couleur principale */
  --bg-primary: #ffffff;       /* Fond principal */
  --text-primary: #212529;     /* Texte principal */
  --spacing-md: 1rem;          /* Espacement moyen */
  --font-family-base: 'Segoe UI', sans-serif;
}
```

### Thèmes
Le site supporte automatiquement les modes clair et sombre :
- **Mode Clair** : Fond blanc, texte sombre
- **Mode Sombre** : Fond sombre, texte clair
- **Persistance** : Choix sauvegardé dans localStorage avec clé `resurgence-theme`

## 🚀 Déploiement

### GitHub Pages
1. Push vers le repository `projet-resurgence.github.io`
2. Activer GitHub Pages dans les paramètres
3. Le site sera disponible à `https://projet-resurgence.github.io`

### Serveur Web Local
```bash
# Serveur simple Python
python -m http.server 8000

# Ou avec Node.js
npx serve .

# Ou avec PHP
php -S localhost:8000
```

### Configuration Production
- **HTTPS** : Obligatoire pour PWA et Service Worker
- **Compression** : Activer gzip/brotli
- **Cache Headers** : Configurer pour les assets statiques
- **CDN** : Optionnel pour de meilleures performances

## 🔧 Maintenance

### Mise à Jour du Contenu
- **Discord Invite** : Remplacer `https://discord.gg/NuwQqWGbHc` dans tous les fichiers
- **Images** : Optimiser et remplacer dans `/images/`
- **Règles** : Mettre à jour regles.html selon l'évolution du serveur
- **Guide** : Actualiser guide.html avec les nouvelles fonctionnalités

### Performance
- **Images** : Compresser avec TinyPNG ou similaire
- **CSS/JS** : Minifier pour la production
- **Cache** : Mettre à jour la version du Service Worker

## 📈 Analytics & Suivi

Le JavaScript inclut un système de tracking d'événements :
- Clics sur liens Discord
- Changements de thème
- Navigation entre pages

Intégrer Google Analytics ou autre solution :
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
```

## 🤝 Contribution

Pour contribuer au site web :
1. Fork le repository
2. Créer une branche feature
3. Respecter la structure CSS existante
4. Tester sur mobile et desktop
5. Submit une Pull Request

## 📞 Support

- **Discord** : [Serveur Projet Résurgence](https://discord.gg/NuwQqWGbHc)
- **Email** : contact@projet-resurgence.fr

---

**Construit avec ❤️ pour la communauté RP francophone**

*Projet Résurgence - Où tout est à rebâtir*
