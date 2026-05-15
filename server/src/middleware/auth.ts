import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bookit-secret-key';

export interface AuthRequest extends Request {
  userId?: string;
  email?: string;
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Step 1 — Get token from request header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided. Please login.' });
      return;
    }

    // Step 2 — Extract token
    const token = authHeader.split(' ')[1];

    // Step 3 — Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    // Step 4 — Attach user info to request
    req.userId = decoded.userId;
    req.email = decoded.email;

    // Step 5 — Move to next function
    next();

  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
  }
};