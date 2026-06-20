// Dynamic Expo config. Wraps the static app.json and injects secrets from the
// environment (.env) into `expo.extra` so `expo-constants` can read them at
// runtime, and registers the native config plugins added for auth / IAP /
// notifications. Keys are intentionally absent in the committed repo — copy
// .env.example to .env and fill them in.
require('dotenv').config();

module.exports = ({ config }) => {
  const plugins = [
    ...(config.plugins ?? []),
    'expo-notifications',
    'expo-apple-authentication',
  ];

  return {
    ...config,
    plugins,
    ios: {
      ...config.ios,
      usesAppleSignIn: true,
    },
    extra: {
      ...config.extra,
      supabaseUrl: process.env.SUPABASE_URL ?? null,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? null,
      revenueCatIosKey: process.env.REVENUECAT_IOS_KEY ?? null,
    },
  };
};
