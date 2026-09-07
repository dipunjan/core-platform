export const LOCAL_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4200',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

export function corsOrigins(
  corsOrigin: string | undefined,
  nodeEnv: string | undefined,
): string[] {
  const env = nodeEnv ?? 'development';
  const trimmed = corsOrigin?.trim();
  if (env === 'production') {
    if (!trimmed || trimmed === '*') {
      throw new Error(
        'CORS_ORIGIN must be an explicit comma-separated origin list in production',
      );
    }
    return splitOrigins(trimmed);
  }
  if (!trimmed || trimmed === '*') {
    return LOCAL_CORS_ORIGINS;
  }
  return splitOrigins(trimmed);
}

function splitOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
