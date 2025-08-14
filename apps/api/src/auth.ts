import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // For now, just use the userId from the token
    // In a real app, you'd look up the user in the database
    req.user = {
      id: decoded.userId,
      email: 'user@example.com', // This will be overridden by /api/auth/me
      name: 'User',
      picture: 'https://ui-avatars.com/api/?name=User&background=random'
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifySimpleToken = async (token: string) => {
  try {
    // Decode our simple base64 token
    const decoded = JSON.parse(atob(token));
    
    return {
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0],
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(decoded.name || decoded.email)}&background=random`,
      userId: `user-${decoded.timestamp}`
    };
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Failed to verify token');
  }
};
