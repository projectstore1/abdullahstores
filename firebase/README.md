# Firebase Setup for Abdullah Store

## 1. Enable Firebase Services

Open [Firebase Console](https://console.firebase.google.com) → select project **ecommerceproject-ca840**.

### Authentication
1. **Build → Authentication → Get started**
2. Enable **Email/Password** sign-in provider.
3. Enable **Google** sign-in provider (set a project support email).
4. Go to **Authentication → Settings → Authorized domains** and add:
   - `localhost`
   - `<your-github-username>.github.io`
   - your custom domain (if any)

### Firestore
1. **Build → Firestore Database → Create database**
2. Choose **Production mode** (rules will be replaced by the ones in this folder).
3. Choose a region close to your users (e.g. `asia-south1`).

### Storage
1. **Build → Storage → Get started**
2. Choose **Production mode**.

### Cloud Messaging (optional)
1. **Build → Cloud Messaging → Web Push certificates → Generate key pair**
2. Save the **VAPID key** — you'll need it in `js/notifications.js`.

---

## 2. Deploy the Rules

You can either use the Firebase CLI or paste them manually.

### Option A — Firebase CLI (recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init firestore storage
# select existing project: ecommerceproject-ca840
# accept defaults for file names, DO NOT overwrite existing files
firebase deploy --only firestore:rules,firestore:indexes,storage
