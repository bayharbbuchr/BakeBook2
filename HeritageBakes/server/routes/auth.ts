import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { generateToken } from '../auth';

interface AuthRequest extends Request {
  user?: { id: number; username: string; createdAt: Date; updatedAt: Date };
}

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Register a new user
router.post('/register', async (req: Request, res: Response) => {
  console.log('Registration request received:', { body: req.body });
  
  try {
    const { username, password } = registerSchema.parse(req.body);
    console.log('Parsed registration data:', { username });
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      console.log('Username already exists:', username);
      return res.status(400).json({ message: 'Username already exists' });
    }

    console.log('Creating new user...');
    // Create new user
    const user = await storage.createUser(username, password);
    console.log('User created:', { id: user.id, username: user.username });
    
    // Ensure user has required fields for token generation
    const now = new Date();
    const userForToken = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt || now,
      updatedAt: user.updatedAt || now
    };
    
    console.log('Generating token for user:', userForToken);
    // Generate JWT token
    const token = generateToken(userForToken);
    
    console.log('Registration successful, sending response');
    res.status(201).json({ 
      user: userForToken, 
      token 
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    if (error instanceof Error) {
      console.error('Registration error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return res.status(500).json({ 
        message: 'Failed to register user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    console.error('Unknown registration error type:', error);
    res.status(500).json({ 
      message: 'An unknown error occurred during registration'
    });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    // Validate user credentials
    const user = await storage.validateUser(username, password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Ensure user has required fields for token generation
    const now = new Date();
    const userForToken = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt || now,
      updatedAt: user.updatedAt || now
    };
    
    // Generate JWT token
    const token = generateToken(userForToken);
    
    res.json({ 
      user: userForToken, 
      token 
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      });
    }
    if (error instanceof Error) {
      console.error('Login error:', error.message);
    } else {
      console.error('Unknown login error');
    }
    res.status(500).json({ message: 'Failed to login' });
  }
});

// Get current user
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    // The auth middleware will attach the user to the request
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get fresh user data from the database
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Ensure all required fields are included
    const now = new Date();
    const userWithRequiredFields = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt || now,
      updatedAt: user.updatedAt || now,
      // Include email if it exists
      ...(user.email && { email: user.email })
    };
    
    res.json({ user: userWithRequiredFields });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get current user' });
  }
});

export default router;
