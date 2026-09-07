export type UserRole = 'customer' | 'admin';

export type AuthUser = {
  sub: string;
  email: string;
  role: UserRole;
};
