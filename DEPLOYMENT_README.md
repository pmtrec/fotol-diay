# 🚀 Guide de Déploiement - Klick Marketplace

Ce guide vous accompagne dans le déploiement de votre application Angular avec Supabase et Prisma.

## 📋 Prérequis

- Node.js (v16 ou supérieur)
- npm ou yarn
- Compte Supabase
- Git

## 🗄️ 1. Configuration de Supabase

### Créer un projet Supabase

1. Rendez-vous sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé API anonyme

### Configuration de la base de données

1. Dans votre dashboard Supabase, allez dans "Settings" > "Database"
2. Récupérez votre connection string PostgreSQL
3. Mettez à jour le fichier `.env` :

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Database URL (remplacez l'URL existante)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

## 🛠️ 2. Déploiement de la Base de Données

### Installation des dépendances

```bash
npm install
```

### Déploiement automatique

```bash
# Déployer le schéma et les données
npm run db:deploy
```

Ou étape par étape :

```bash
# 1. Générer le client Prisma
npm run db:generate

# 2. Appliquer le schéma à Supabase
npm run db:push

# 3. Insérer les données de seed
npm run db:seed
```

## 🌐 3. Configuration de l'Application

### Variables d'environnement

Mettez à jour `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://your-project-id.supabase.co',
  supabaseAnonKey: 'your-anon-key',
  // ... autres configurations
};
```

### Build de production

```bash
npm run build
```

## 🚀 4. Déploiement de l'Application

### Option 1: Vercel (Recommandé)

1. **Installation de Vercel CLI**
```bash
npm install -g vercel
```

2. **Connexion à Vercel**
```bash
vercel login
```

3. **Déploiement**
```bash
vercel --prod
```

### Option 2: Netlify

1. **Build local**
```bash
npm run build
```

2. **Déploiement manuel**
- Uploadez le dossier `dist/frontend` sur Netlify
- Configurez les variables d'environnement dans le dashboard Netlify

### Option 3: Serveur traditionnel

```bash
# Installation d'un serveur statique
npm install -g serve

# Démarrer le serveur
serve -s dist/frontend -l 80
```

## 🔧 5. Configuration de Production

### Variables d'environnement de production

Créez un fichier `.env.production` :

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Mettez à jour `src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  supabaseUrl: process.env['SUPABASE_URL'] || 'your-fallback-url',
  supabaseAnonKey: process.env['SUPABASE_ANON_KEY'] || 'your-fallback-key',
  // ... autres configurations
};
```

## 📊 6. Vérification du Déploiement

### Tests à effectuer

1. **Vérification de la base de données**
```bash
npm run db:studio
```
Puis visitez http://localhost:5555 pour voir vos données

2. **Test de l'API**
- Vérifiez que les produits se chargent
- Testez la création d'un compte utilisateur
- Vérifiez les permissions

3. **Test de l'application déployée**
- Vérifiez que toutes les pages fonctionnent
- Testez les fonctionnalités principales
- Vérifiez la responsivité

## 🔒 7. Sécurité

### Configuration de sécurité recommandée

1. **Row Level Security (RLS)**
```sql
-- Activer RLS sur les tables sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

2. **Politiques de sécurité**
```sql
-- Exemple : Les vendeurs ne voient que leurs produits
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = seller_id);
```

## 🛠️ 8. Maintenance

### Commandes utiles

```bash
# Mettre à jour le schéma
npm run db:push

# Ajouter de nouvelles données
npm run db:seed

# Voir les données en local
npm run db:studio

# Générer une nouvelle migration
npx prisma migrate dev --name nom-de-la-migration
```

## 📞 Support

En cas de problème :

1. Vérifiez les logs dans le terminal
2. Consultez la documentation Supabase
3. Vérifiez la configuration réseau
4. Testez la connectivité à la base de données

## 🎉 Félicitations !

Votre application Klick Marketplace est maintenant déployée avec :
- ✅ Base de données Supabase configurée
- ✅ Données de seed importées
- ✅ Application Angular fonctionnelle
- ✅ Services de données opérationnels

Vous pouvez maintenant partager votre application avec vos utilisateurs !