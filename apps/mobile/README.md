# OpenRegistro mobile

Official Android / iOS client: pick your school from the public directory, then
sign in inside a WebView pointed at that school's own OpenRegistro instance.

## Develop

This package is intentionally outside the pnpm workspace (Expo needs React 18;
the rest of the monorepo is on React 19).

```bash
cd apps/mobile
npm install
npx expo start
```

## School directory

The picker loads `https://api.openregistro.another-horizon.eu/api/directory/schools`.
Operators manage hosted + self-hosted visibility from `/cp` (Mobile app directory).

## APK

Every `v*` git tag builds `OpenRegistro.apk` in CI and attaches it to the GitHub
Release. See `.github/workflows/mobile-apk.yml`.
