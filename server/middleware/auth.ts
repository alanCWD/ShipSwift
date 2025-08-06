import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real application, you'd validate JWT tokens here
    // For this demo, we'll use a simple user ID in headers
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'customer',
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  await requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};
