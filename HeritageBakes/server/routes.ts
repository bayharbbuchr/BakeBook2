import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecipeSchema } from "@shared/schema";
import { z } from "zod";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { authenticateToken } from "./auth";
import authRoutes from "./routes/auth";

type AuthenticatedRequest = Request & {
  user?: { id: number; username: string };
  file?: Express.Multer.File;
};

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Auth routes
  app.use('/api/auth', authRoutes);

  // Get all recipes (only returns user's recipes when authenticated)
  app.get("/api/recipes", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    console.log("Decoded user from JWT:", req.user);
    try {
      const userId = req.user?.id;
      const recipes = await storage.getRecipes(userId);
      res.json(recipes);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching recipes:', error.message);
      } else {
        console.error('Unknown error fetching recipes');
      }
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  // Get single recipe
  app.get("/api/recipes/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      const recipe = await storage.getRecipe(id, userId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching recipe:', error.message);
      } else {
        console.error('Unknown error fetching recipe');
      }
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Create new recipe
  app.post("/api/recipes", authenticateToken, upload.single('photo'), async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      let recipeData;
      
      if (req.file) {
        // If file upload, parse form data
        recipeData = {
          title: req.body.title,
          ingredients: JSON.parse(req.body.ingredients || '[]'),
          directions: req.body.directions,
          memory: req.body.memory || null,
          tags: JSON.parse(req.body.tags || '[]'),
          cookTime: req.body.cookTime || null,
          photo: `/uploads/${req.file.filename}`
        };
      } else {
        // If JSON data
        recipeData = req.body;
      }

      const validatedData = insertRecipeSchema.parse({
        ...recipeData,
        userId: req.user.id
      });
      const recipe = await storage.createRecipe(validatedData, req.user.id);
      
      res.status(201).json(recipe);
    } catch (error) {
      console.error('Recipe creation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid recipe data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  // Update recipe
  app.put("/api/recipes/:id", authenticateToken, upload.single('photo'), async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Verify the recipe exists and belongs to the user
      const existingRecipe = await storage.getRecipe(id, userId);
      if (!existingRecipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      let updateData;
      if (req.file) {
        updateData = {
          title: req.body.title,
          ingredients: JSON.parse(req.body.ingredients || '[]'),
          directions: req.body.directions,
          memory: req.body.memory || null,
          tags: JSON.parse(req.body.tags || '[]'),
          cookTime: req.body.cookTime || null,
          photo: `/uploads/${req.file.filename}`
        };
      } else {
        updateData = req.body;
      }

      const validatedData = insertRecipeSchema.partial().parse(updateData);
      const updatedRecipe = await storage.updateRecipe(id, validatedData, userId);
      
      if (!updatedRecipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(updatedRecipe);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if ('name' in error && error.name === 'ZodError') {
          const zodError = error as z.ZodError;
          return res.status(400).json({ 
            message: "Invalid recipe data", 
            errors: zodError.errors 
          });
        }
        console.error('Recipe update error:', error.message);
      }
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });

  // Delete recipe
  app.delete("/api/recipes/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Verify the recipe exists and belongs to the user
      const existingRecipe = await storage.getRecipe(id, userId);
      if (!existingRecipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      const success = await storage.deleteRecipe(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error deleting recipe:', error.message);
      } else {
        console.error('Unknown error deleting recipe');
      }
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Search recipes
  app.get("/api/recipes/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const recipes = await storage.searchRecipes(query);
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to search recipes" });
    }
  });

  // Get recipes by tags
  app.post("/api/recipes/filter", async (req, res) => {
    try {
      const { tags } = req.body;
      
      if (!Array.isArray(tags)) {
        return res.status(400).json({ message: "Tags must be an array" });
      }
      
      const recipes = await storage.getRecipesByTags(tags);
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter recipes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
