export interface JwtPayload {
  userId?: string;
  sub?: string;  // Add sub field for compatibility with JWT standard
  email?: string;
  isAdmin?: boolean;
  role?: string;  // Add role field to support the role property in the token payload
  iat?: number;
  exp?: number;
}
