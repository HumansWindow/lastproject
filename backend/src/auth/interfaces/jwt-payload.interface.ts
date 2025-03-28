export interface JwtPayload {
  userId?: string;
  sub?: string;  // Add sub field for compatibility with JWT standard
  email?: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}
