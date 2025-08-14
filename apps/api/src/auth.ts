import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


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
    
    // Extract user info from the token
    // The userId contains the email and timestamp
    const userIdParts = decoded.userId.split('-');
    const timestamp = userIdParts[userIdParts.length - 1];
    
    // We'll store the email in the token payload for easy access
    req.user = {
      id: decoded.userId,
      email: decoded.email || 'user@example.com',
      name: decoded.name || 'User',
      picture: decoded.picture || 'https://ui-avatars.com/api/?name=User&background=random'
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const generateToken = (userId: string, email: string, name: string, picture: string): string => {
  return jwt.sign({ userId, email, name, picture }, JWT_SECRET, { expiresIn: '7d' });
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
