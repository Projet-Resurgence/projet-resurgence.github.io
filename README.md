# Projet Résurgence - Site Web Officiel

Site web officiel du serveur Discord RP géopolitique francophone **Projet Résurgence**.

## 🌍 Aperçu

Ce site présente l'univers post-apocalyptique de Projet Résurgence et les fonctionnalités du bot NewEra qui gère le serveur Discord. Il s'agit d'une expérience de roleplay géopolitique immersive où les joueurs incarnent des nations émergentes dans un monde à reconstruire.

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
├── manifest.json           # Manifest PWA
├── sw.js                   # Service Worker
├── styles/
│   ├── main.css            # Styles principaux avec thème
│   └── main.js             # JavaScript principal
├── images/
│   ├── final__logo.png     # Logo principal
│   ├── final__logo_centered.png # Logo centré
│   └── banner.png          # Bannière
└── README.md               # Documentation
```

## 🎯 Sections du Site

### 🏠 Accueil (Hero)
- Présentation du serveur et de l'univers
- Appels à l'action vers Discord
- Bannière immersive avec overlay

### ⚙️ Fonctionnalités du Bot
- **Système Gouvernemental** : Gestion des postes politiques
- **Économie Multi-Devises** : Argent, points politiques/diplomatiques
- **Militaire & Guerre** : Recrutement, batailles, infrastructure
- **Système Géographique** : Cartographie interactive
- **Assistance IA** : Integration Groq pour le RP
- **Construction & Technologies** : Développement des nations

### 🌍 Univers
- Contexte post-apocalyptique (2045)
- Liberté créative totale
- Équilibre sérieux/créativité
- Communauté francophone accueillante

### 📊 Statistiques
- Bot actif 24/7
- Plus de 100 commandes
- Possibilités RP infinies
- Année RP : 2045

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
- **Persistance** : Choix sauvegardé dans localStorage

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
- **Statistiques** : Modifier les valeurs dans la section stats
- **Liens Discord** : Remplacer `https://discord.gg/votre-invite`
- **Images** : Optimiser et remplacer dans `/images/`

### Performance
- **Images** : Compresser avec TinyPNG ou similaire
- **CSS/JS** : Minifier pour la production
- **Cache** : Mettre à jour la version du Service Worker

## 📈 Analytics & Suivi

Le JavaScript inclut un système de tracking d'événements :
- Clics sur liens Discord
- Changements de thème
- Interactions avec les fonctionnalités

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

- **Discord** : [Serveur Projet Résurgence](https://discord.gg/votre-invite)
- **GitHub** : [Issues & Bug Reports](https://github.com/Projet-Resurgence/issues)
- **Email** : contact@projet-resurgence.fr

---

**Construit avec ❤️ pour la communauté RP francophone**

*Projet Résurgence - Où tout est à rebâtir*
