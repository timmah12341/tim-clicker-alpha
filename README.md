# tim-clicker Firebase production origin checklist

This repository uses Firebase Auth (email/password + reset email) with API key:

- `AIzaSyBZDGbuenDWIE8O0hjCa8h98n1os-8MZNs`

## Required production origin allowlist

In **Google Cloud Console → APIs & Services → Credentials → API key restrictions** for the key above,
set **Application restrictions** to **HTTP referrers (web sites)** and include:

- `https://tim-clicker.firebaseapp.com/*`
- `https://tim-clicker.web.app/*`
- `https://timmah12341.github.io/*`
- `https://timmah12341.github.io/tim-clicker/*`

If a custom domain is used in production, add the exact origin pattern there as well.

## Firebase Authentication authorized domains

In **Firebase Console → Authentication → Settings → Authorized domains**, ensure these hosts exist:

- `tim-clicker.firebaseapp.com`
- `tim-clicker.web.app`
- `timmah12341.github.io`

Plus any custom production domain hostnames (host only, no protocol/path).

## Identity Toolkit API

In **Google Cloud Console → APIs & Services → Enabled APIs & services**, verify:

- `Identity Toolkit API` is enabled for project `tim-clicker`.

## Verify password reset after propagation

After allowlist changes propagate, verify reset behavior from a production origin:

1. Open the production site and run a password reset request from the UI.
2. Confirm there is no 400 response caused by domain/key restrictions.
3. In browser network tools, ensure `accounts:sendOobCode` is successful.

If a 400 persists, review API key HTTP referrers and Firebase Auth authorized domains for exact hostname mismatches.
