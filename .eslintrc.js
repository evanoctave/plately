module.exports = {
  root: true,
  extends: ['expo'],
  // supabase/functions is Deno code (URL imports) — not resolvable by the RN toolchain.
  ignorePatterns: ['node_modules/', 'dist/', 'ios/', 'android/', '.expo/', 'supabase/functions/'],
};
