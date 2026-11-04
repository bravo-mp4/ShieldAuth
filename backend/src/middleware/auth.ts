import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";
import { getUserById } from "../database";

const JWT_ALGORITHM = "HS256";

export function signToken(user: { id: number; email: string; role: string; token_version: number }): string {
  // tv lets a password change or reset invalidate every token issued before it.
  return jwt.sign({ id: user.id, email: user.email, role: user.role, tv: user.token_version }, config.jwtSecret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

/**
 * Verifies the bearer token, then re-reads the user so that a ban, a role
 * change, a password reset or a deleted account takes effect immediately
 * rather than when the token happens to expire.
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Access token required" });
  }

  let payload: jwt.JwtPayload;
  try {
    // Pinning the algorithm stops "alg: none" and algorithm-confusion tricks.
    payload = jwt.verify(token, config.jwtSecret, {
      algorithms: [JWT_ALGORITHM],
    }) as jwt.JwtPayload;
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const user = typeof payload.id === "number" ? await getUserById(payload.id) : null;
  if (!user || user.is_banned || payload.tv !== user.token_version) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
}

function checkAdminRole(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Platform-admin routes: a valid session and the admin role, in that order.
export const requireAdmin = [authenticateToken, checkAdminRole];
