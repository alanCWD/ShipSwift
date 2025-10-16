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
    interface Session {
      userId?: string;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Debug session and headers
    console.log('Session check:', {
      sessionId: req.sessionID,
      userId: req.session?.userId,
      sessionExists: !!req.session,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        userAgent: req.headers['user-agent']?.substring(0, 50)
      }
    });
    
    // Check for user ID in session first (preferred method)
    let userId = (req.session as any)?.userId;
    
    // Simple session-based authentication (works for both regular and iframe contexts)
    
    if (!userId) {
      console.log('No userId in session - iframe context detected');
      return res.status(401).json({ 
        message: 'Authentication required',
        context: 'iframe_auth_failed',
        debug: {
          sessionExists: !!req.session,
          sessionId: req.sessionID,
          cookiePresent: !!req.headers.cookie
        }
      });
    }

    const user = await storage.getUser(userId);
    if (!user || !user.isActive) {
      // Clear invalid session
      (req.session as any).userId = undefined;
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
    // Both 'admin' and 'ablp_admin' roles have admin access
    if (req.user?.role !== 'admin' && req.user?.role !== 'ablp_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};
