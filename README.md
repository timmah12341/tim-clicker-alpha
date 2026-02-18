# WeNeedTimClickerUpdate

## Google login setup checklist

If the Google sign-in popup is failing, double-check this order:

1. **Firebase Authentication**
   - Firebase Console → **Authentication** → **Sign-in method**.
   - Enable **Google** provider.

2. **Authorized domains**
   - Firebase Console → **Authentication** → **Settings** → **Authorized domains**.
   - Add all domains you run the game from (for local testing include `localhost`).

3. **Google Cloud APIs** (for the Firebase project backing this app)
   - In Google Cloud Console, make sure **Identity Toolkit API** is enabled.
   - In most Firebase setups, this is the key API behind Firebase Auth operations.

4. **OAuth consent screen / branding (if prompted by Google Cloud)**
   - Configure the consent screen so Google sign-in requests are allowed.
   - If app is in testing mode, add your Google account as a test user.

If popup flow is blocked by browser settings, the app falls back to redirect login.
