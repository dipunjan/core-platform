export const AUTH_TOKENS_HEADER = 'x-auth-response';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: { id: string; email: string; name: string };
};

export function wantsJsonTokens(headers: {
  [key: string]: string | string[] | undefined;
}): boolean {
  const raw = headers[AUTH_TOKENS_HEADER] ?? headers['X-Auth-Response'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.toLowerCase() === 'tokens';
}

export function sessionForClient(
  session: AuthSession,
  includeTokens: boolean,
): AuthSession | Omit<AuthSession, 'accessToken' | 'refreshToken'> {
  if (includeTokens) {
    return session;
  }
  return {
    tokenType: session.tokenType,
    expiresIn: session.expiresIn,
    user: session.user,
  };
}
