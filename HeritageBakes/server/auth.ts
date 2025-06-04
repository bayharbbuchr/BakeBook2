import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

export interface User {
  id: number;
  username: string;
  email?: string | null;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function generateToken(user: { id: number; username: string; email?: string | null; createdAt: Date; updatedAt: Date }): string {
  const payload: any = { 
    id: user.id, 
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
  
  // Include email in the token if it exists
  if (user.email) {
    payload.email = user.email;
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  console.log('Authentication middleware called');
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  // Try to get token from Authorization header first
  const authHeader = req.headers['authorization'];
  console.log('Authorization header:', authHeader);
  
  let token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted token from header:', token ? '[token exists]' : 'none');

  // If no token in header, try to get it from cookies
  if (!token && req.cookies && req.cookies.token) {
    console.log('Getting token from cookies');
    token = req.cookies.token;
    console.log('Extracted token from cookie:', token ? '[token exists]' : 'none');
  }

  if (!token) {
    console.log('No authentication token provided in request');
    return res.status(401).json({ 
      error: 'Authentication required',
      details: 'No authentication token found in Authorization header or cookies',
      receivedHeaders: Object.keys(req.headers)
    });
  }

  try {
    console.log('Verifying JWT token');
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { 
        id: number; 
        username: string; 
        email?: string;
        createdAt: string; 
        updatedAt: string 
      };
      console.log('Token verified successfully. User ID:', decoded.id);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(403).json({ 
        error: 'Invalid token',
        details: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error'
      });
    }
    
    // Get the user from the database
    const user = await storage.getUser(decoded.id);
    if (!user) {
      console.log(`User with ID ${decoded.id} not found`);
      return res.status(403).json({ error: 'User not found' });
    }

    // Convert string dates back to Date objects
    const createdAt = typeof decoded.createdAt === 'string' ? new Date(decoded.createdAt) : new Date();
    const updatedAt = typeof decoded.updatedAt === 'string' ? new Date(decoded.updatedAt) : new Date();
    
    // Add user to request object with all required fields
    const userObj: { id: number; username: string; email?: string; createdAt: Date; updatedAt: Date } = {
      id: user.id,
      username: user.username,
      createdAt,
      updatedAt
    };
    
    // Only add email if it exists
    if (user.email) {
      userObj.email = user.email;
    }
    
    req.user = userObj;
    
    console.log(`Authenticated user: ${user.username} (ID: ${user.id})`);
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: { 
        id: number; 
        username: string; 
        email?: string;
        createdAt: Date; 
        updatedAt: Date 
      };
    }
  }
}
