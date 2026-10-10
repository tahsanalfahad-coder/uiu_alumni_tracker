// Central environment handling. Secrets are NEVER given insecure fallbacks.

// This value used to be hardcoded as a fallback and was published in the README.
// It is treated as compromised and refused everywhere except automated tests.
export const LEGACY_DEFAULT_SECRET = 'uiu_alumni_tracker_secret_key_2026';

export const isTest = () => process.env.NODE_ENV === 'test';
export const isProduction = () => process.env.NODE_ENV === 'production';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (isTest()) return secret || LEGACY_DEFAULT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  if (secret === LEGACY_DEFAULT_SECRET) {
    throw new Error(
      'JWT_SECRET is set to the old public default from the README. Generate a new random secret.'
    );
  }
  return secret;
}

// Called once at startup so misconfiguration fails fast and loudly.
export function validateEnv() {
  getJwtSecret(); // throws if missing / insecure

  if (process.env.JWT_SECRET.length < 32) {
    console.warn('[Config Warning]: JWT_SECRET is shorter than 32 characters. Use a longer random value.');
  }
  if (isProduction() && (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).includes('*')) {
    console.warn('[Config Warning]: ALLOWED_ORIGINS contains "*". Restrict it to your real frontend URLs.');
  }
}
