# Données de Test pour Klick E-commerce

## Informations de Connexion

Voici les comptes de test disponibles :

### Compte Administrateur
- **Email :** `admin@klick.com`
- **Mot de passe :** `admin123`
- **Rôle :** Administrateur
- **Fonctionnalités :** Validation des produits, gestion des catégories, analytics

### Comptes Vendeurs
#### Vendeur 1 - Marie Dubois
- **Email :** `vendeur1@klick.com`
- **Mot de passe :** `vendeur123`
- **Boutique :** Boutique Marie (Mode féminine)

#### Vendeur 2 - Jean Martin
- **Email :** `vendeur2@klick.com`
- **Mot de passe :** `vendeur123`
- **Boutique :** TechStore Jean (Électronique)

### Compte Client
- **Email :** `client1@klick.com`
- **Mot de passe :** `client123`
- **Rôle :** Client

## Données de Test Incluses

### Catégories (5)
1. **Électronique** - Téléphones, ordinateurs, tablettes
2. **Mode** - Vêtements, chaussures, accessoires
3. **Maison & Jardin** - Décoration, meubles
4. **Sports & Loisirs** - Équipements sportifs
5. **Livres** - Livres, ebooks, magazines

### Produits (8 produits de test)

#### Produits Approuvés :
- **iPhone 15 Pro Max** (Électronique) - 899 000 XAF
- **Robe d'été fleurie** (Mode) - 35 000 XAF
- **Livre "Le Petit Prince"** (Livres) - 8 500 XAF
- **Casque Bluetooth Sony** (Électronique) - 285 000 XAF

#### Produits en Attente :
- **Lampe de bureau LED** (Maison & Jardin) - 25 000 XAF
- **Haltères réglables 10kg** (Sports & Loisirs) - 45 000 XAF
- **Plante grasse Aloe Vera** (Maison & Jardin) - 15 000 XAF

#### Produits Rejetés :
- **Sac à main en cuir** (Mode) - 75 000 XAF
  *Raison : Photos de qualité insuffisante*

## Comment Tester l'Application

### 1. Démarrage
```bash
npm run start
```

### 2. Connexion Automatique
L'application se connecte automatiquement avec le compte administrateur au démarrage.

### 3. Navigation Admin
- **Dashboard** : Vue d'ensemble avec statistiques
- **Validation Produits** : Approuver/rejeter les produits en attente
- **Catégories** : Gestion des catégories (simulé)

### 4. Test Vendeur
1. Déconnectez-vous (bouton logout)
2. Connectez-vous avec `vendeur1@klick.com` / `vendeur123`
3. Testez :
   - Dashboard vendeur
   - Ajout de nouveaux produits
   - Gestion des produits

### 5. Test Client
1. Déconnectez-vous
2. Connectez-vous avec `client1@klick.com` / `client123`
3. Testez la navigation client

## Structure des Données

### Services Mock
- **MockDataService** : Fournit toutes les données de test
- **MockAuthService** : Gestion de l'authentification
- **ProductService** : Utilise les données mock pour les opérations CRUD
- **AuthService** : Interface utilisant MockAuthService

### Modèles de Données
- **User** : Utilisateurs avec rôles (admin, seller, customer)
- **Product** : Produits avec statuts (pending, approved, rejected)
- **Category** : Catégories de produits

## Développement

Pour ajouter de nouvelles données de test :
1. Modifier `MockDataService`
2. Les changements sont automatiquement reflétés dans l'application

Pour basculer vers une vraie API :
1. Remplacer les appels mock par de vraies requêtes HTTP
2. Mettre à jour les services pour utiliser `ApiService`