import fs from 'fs/promises';
import path from 'path';
import { type Recipe, type InsertRecipe, type User as SharedUser } from "@shared/schema";
import { User, hashPassword, comparePasswords } from './auth';

// Custom error class for storage-related errors
class StorageError extends Error {
  constructor(message: string, public readonly code: string = 'STORAGE_ERROR') {
    super(message);
    this.name = 'StorageError';
  }
}

// Error for when a resource is not found
class NotFoundError extends StorageError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with ID ${id} not found`, 'NOT_FOUND');
  }
}

// Error for when a resource already exists
class AlreadyExistsError extends StorageError {
  constructor(resource: string, field: string, value: string | number) {
    super(`${resource} with ${field} '${value}' already exists`, 'ALREADY_EXISTS');
  }
}

// Error for validation failures
class ValidationError extends StorageError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export interface IStorage {
  // Recipe methods
  getRecipes(userId?: number): Promise<Recipe[]>;
  getRecipe(id: number, userId?: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe, userId: number): Promise<Recipe>;
  updateRecipe(id: number, updates: Partial<InsertRecipe>, userId: number): Promise<Recipe | undefined>;
  deleteRecipe(id: number, userId: number): Promise<boolean>;
  searchRecipes(query: string, userId?: number): Promise<Recipe[]>;
  getRecipesByTags(tags: string[], userId?: number): Promise<Recipe[]>;
  
  // User methods
  getUser(id: number): Promise<Omit<User, 'password'> | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(username: string, password: string): Promise<Omit<User, 'password'>>;
  validateUser(username: string, password: string): Promise<Omit<User, 'password'> | null>;
}

export class JsonFileStorage implements IStorage {
  private recipesFilePath: string;
  private usersFilePath: string;

  constructor() {
    this.recipesFilePath = path.join(process.cwd(), 'server', 'data', 'recipes.json');
    this.usersFilePath = path.join(process.cwd(), 'server', 'data', 'users.json');
  }

  /**
   * Helper method to parse a date from various input types
   */
  private parseDate(dateValue: unknown, path: string): Date | null {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    if (typeof dateValue === 'string') {
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    if (dateValue === null || dateValue === undefined) {
      return null;
    }
    
    console.warn(`Invalid date format at ${path}:`, dateValue);
    return new Date();
  }
  
  private async readRecipes(): Promise<Recipe[]> {
    try {
      // Ensure the directory exists
      await fs.mkdir(path.dirname(this.recipesFilePath), { recursive: true });
      
      // Check if file exists, if not return empty array
      try {
        await fs.access(this.recipesFilePath);
      } catch (err) {
        // File doesn't exist, return empty array
        return [];
      }
      
      const data = await fs.readFile(this.recipesFilePath, 'utf-8');
      let recipes: any[];
      
      try {
        recipes = JSON.parse(data);
        if (!Array.isArray(recipes)) {
          throw new Error('Expected an array of recipes');
        }
      } catch (parseError) {
        console.error('Failed to parse recipes file:', parseError);
        return [];
      }
      
      // Convert createdAt strings back to Date objects
      return recipes.map(recipe => ({
        ...recipe,
        createdAt: this.parseDate(recipe.createdAt, 'recipe.createdAt') || new Date(),
        updatedAt: this.parseDate(recipe.updatedAt, 'recipe.updatedAt') || new Date()
      }));
    } catch (error) {
      console.error('Error reading recipes file:', error);
      return [];
    }
  }

  private async writeRecipes(recipes: Recipe[]): Promise<void> {
    try {
      // Validate input
      if (!Array.isArray(recipes)) {
        throw new ValidationError('Expected an array of recipes');
      }
      
      // Ensure the directory exists
      await fs.mkdir(path.dirname(this.recipesFilePath), { recursive: true });
      
      // Convert Date objects to ISO strings for JSON serialization
      const now = new Date().toISOString();
      const serializedRecipes = recipes.map(recipe => ({
        ...recipe,
        createdAt: recipe.createdAt ? recipe.createdAt.toISOString() : now,
        updatedAt: recipe.updatedAt ? recipe.updatedAt.toISOString() : now
      }));
      
      // Write to a temporary file first, then rename to ensure atomicity
      const tempFilePath = `${this.recipesFilePath}.tmp`;
      await fs.writeFile(tempFilePath, JSON.stringify(serializedRecipes, null, 2), 'utf-8');
      
      // On Windows, we need to remove the destination file first if it exists
      try {
        await fs.rename(tempFilePath, this.recipesFilePath);
      } catch (renameError) {
        // If rename fails (e.g., cross-device link), fall back to copy + delete
        await fs.copyFile(tempFilePath, this.recipesFilePath);
        await fs.unlink(tempFilePath).catch(() => {}); // Ignore errors in cleanup
      }
    } catch (error) {
      console.error('Error writing recipes file:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  private async readUsers(): Promise<User[]> {
    try {
      // Ensure the directory exists
      await fs.mkdir(path.dirname(this.usersFilePath), { recursive: true });
      
      // Check if file exists, if not return empty array
      try {
        await fs.access(this.usersFilePath);
      } catch (err) {
        // File doesn't exist, return empty array
        return [];
      }
      
      const data = await fs.readFile(this.usersFilePath, 'utf-8');
      let users: any[];
      
      try {
        users = JSON.parse(data);
        if (!Array.isArray(users)) {
          throw new Error('Expected an array of users');
        }
      } catch (parseError) {
        console.error('Failed to parse users file:', parseError);
        return [];
      }
      
      // Convert date strings back to Date objects and ensure all required fields exist
      return users.map((user, index) => {
        const now = new Date();
        const id = typeof user.id === 'number' ? user.id : 0;
        const username = typeof user.username === 'string' ? user.username.trim() : '';
        const password = typeof user.password === 'string' ? user.password : '';
        
        if (!username) {
          console.warn(`User at index ${index} has no username`);
        }
        
        if (!password) {
          console.warn(`User ${username || 'at index ' + index} has no password`);
        }
        
        return {
          ...user,
          id,
          username,
          password,
          createdAt: this.parseDate(user.createdAt, `users[${index}].createdAt`) || now,
          updatedAt: this.parseDate(user.updatedAt, `users[${index}].updatedAt`) || now
        };
      });
    } catch (error) {
      console.error('Error reading users file:', error);
      return [];
    }
  }

  private async writeUsers(users: User[]): Promise<void> {
    try {
      // Validate input
      if (!Array.isArray(users)) {
        throw new ValidationError('Expected an array of users');
      }
      
      // Ensure the directory exists
      await fs.mkdir(path.dirname(this.usersFilePath), { recursive: true });
      
      // Convert Date objects to ISO strings for JSON serialization
      const now = new Date().toISOString();
      const serializedUsers = users.map(user => {
        // Basic validation
        if (typeof user.id !== 'number' || user.id <= 0) {
          console.warn(`User has invalid ID: ${user.id}`);
        }
        
        if (typeof user.username !== 'string' || user.username.trim() === '') {
          console.warn(`User ${user.id} has invalid username`);
        }
        
        if (typeof user.password !== 'string' || user.password === '') {
          console.warn(`User ${user.id} has invalid password`);
        }
        
        return {
          ...user,
          username: user.username.trim(),
          createdAt: user.createdAt ? user.createdAt.toISOString() : now,
          updatedAt: user.updatedAt ? user.updatedAt.toISOString() : now
        };
      });
      
      // Write to a temporary file first, then rename to ensure atomicity
      const tempFilePath = `${this.usersFilePath}.tmp`;
      await fs.writeFile(tempFilePath, JSON.stringify(serializedUsers, null, 2), 'utf-8');
      
      // On Windows, we need to remove the destination file first if it exists
      try {
        await fs.rename(tempFilePath, this.usersFilePath);
      } catch (renameError) {
        // If rename fails (e.g., cross-device link), fall back to copy + delete
        await fs.copyFile(tempFilePath, this.usersFilePath);
        await fs.unlink(tempFilePath).catch(() => {}); // Ignore errors in cleanup
      }
    } catch (error) {
      console.error('Error writing users file:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  private getNextRecipeId(recipes: Recipe[]): number {
    return recipes.length > 0 ? Math.max(...recipes.map(r => r.id)) + 1 : 1;
  }

  // Recipe methods
  async getRecipes(userId?: number): Promise<Recipe[]> {
    const recipes = await this.readRecipes();
    if (typeof userId !== 'number') return [];
    return recipes.filter(recipe => Number(recipe.userId) === userId);
  }

  async getRecipe(id: number, userId?: number): Promise<Recipe | undefined> {
    const recipes = await this.readRecipes();
    const recipe = recipes.find(r => r.id === id);
    
    // If recipe not found, return undefined
    if (!recipe) return undefined;
    
    // If userId is provided and doesn't match the recipe's userId, return undefined
    if (userId !== undefined && recipe.userId !== userId) {
      console.log(`Recipe ${id} access denied: user ${userId} does not own this recipe`);
      return undefined;
    }
    
    return recipe;
  }

  async createRecipe(recipe: InsertRecipe, userId: number): Promise<Recipe> {
    const recipes = await this.readRecipes();
    const id = this.getNextRecipeId(recipes);
    const now = new Date();
    
    const newRecipe: Recipe = {
      ...recipe,
      id,
      userId,
      createdAt: now,
      updatedAt: now
    };
    
    recipes.push(newRecipe);
    await this.writeRecipes(recipes);
    return newRecipe;
  }

  async updateRecipe(id: number, updates: Partial<InsertRecipe>, userId: number): Promise<Recipe | undefined> {
    const recipes = await this.readRecipes();
    const index = recipes.findIndex(recipe => recipe.id === id && recipe.userId === userId);
    
    if (index === -1) return undefined;
    
    const now = new Date();
    const updatedRecipe = {
      ...recipes[index],
      ...updates,
      id,
      userId,
      updatedAt: now
    };
    
    // Preserve the original createdAt date
    updatedRecipe.createdAt = recipes[index].createdAt;
    
    recipes[index] = updatedRecipe;
    await this.writeRecipes(recipes);
    return updatedRecipe;
  }

  async deleteRecipe(id: number, userId: number): Promise<boolean> {
    const recipes = await this.readRecipes();
    const recipeIndex = recipes.findIndex(recipe => recipe.id === id && recipe.userId === userId);
    
    // If recipe not found or user doesn't have permission, return false
    if (recipeIndex === -1) return false;
    
    // Remove the recipe
    recipes.splice(recipeIndex, 1);
    await this.writeRecipes(recipes);
    return true;
  }

  async searchRecipes(query: string, userId?: number): Promise<Recipe[]> {
    // First get all recipes (or just the user's recipes if userId is provided)
    const recipes = await this.getRecipes(userId);
    const searchTerm = query.toLowerCase().trim();
    
    // If no search term, return empty array
    if (!searchTerm) return [];
    
    // Split into individual search terms (split by spaces and filter out empty strings)
    const searchTerms = searchTerm.split(/\s+/).filter(term => term.length > 0);
    
    return recipes.filter(recipe => {
      // Prepare text to search in
      const searchText = [
        recipe.title || '',
        recipe.memory || '',
        ...(recipe.ingredients || []).filter(ing => typeof ing === 'string')
      ].join(' ').toLowerCase();
      
      // Check if all search terms are present in the search text
      return searchTerms.every(term => searchText.includes(term));
    });
  }

  async getRecipesByTags(tags: string[], userId?: number): Promise<Recipe[]> {
    if (!tags || tags.length === 0) return [];
    
    // Filter out any non-string or empty tags and convert to lowercase for case-insensitive matching
    const validTags = tags
      .filter((tag): tag is string => {
        const isValid = tag && typeof tag === 'string' && tag.trim() !== '';
        return Boolean(isValid);
      })
      .map(tag => tag.toLowerCase().trim());
      
    if (validTags.length === 0) return [];
    
    const recipes = await this.getRecipes(userId);
    
    return recipes.filter(recipe => {
      if (!recipe.tags || !Array.isArray(recipe.tags)) return false;
      
      // Convert all recipe tags to lowercase for case-insensitive comparison
      const recipeTags = recipe.tags
        .filter((tag): tag is string => {
          const isValid = tag && typeof tag === 'string';
          return Boolean(isValid);
        })
        .map(tag => tag.toLowerCase().trim());
      
      // Check if any of the valid tags match any of the recipe's tags
      return validTags.some(tag => recipeTags.includes(tag));
    });
  }

  // User methods
  async getUser(id: number): Promise<Omit<User, 'password'> | undefined> {
    if (!id || typeof id !== 'number' || id <= 0) {
      return undefined;
    }
    
    try {
      const users = await this.readUsers();
      const user = users.find(u => u.id === id);
      
      if (!user) return undefined;
      
      // Omit password from the returned user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error(`Error getting user with id ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return undefined;
    }
    
    try {
      const users = await this.readUsers();
      const normalizedUsername = username.toLowerCase().trim();
      
      return users.find(u => 
        u.username && 
        typeof u.username === 'string' && 
        u.username.toLowerCase() === normalizedUsername
      );
    } catch (error) {
      console.error(`Error getting user with username ${username}:`, error);
      return undefined;
    }
  }

  async validateUser(username: string, password: string): Promise<Omit<User, 'password'> | null> {
    try {
      if (!username || !password) {
        return null;
      }

      const user = await this.getUserByUsername(username);
      if (!user) {
        return null;
      }

      // Verify the password
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return null;
      }

      // Update the user's last login time
      const now = new Date();
      const users = await this.readUsers();
      const userIndex = users.findIndex(u => u.id === user.id);
      
      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          updatedAt: now
        };
        await this.writeUsers(users);
      }

      // Omit password from the returned user object
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error validating user:', error);
      return null;
    }
  }

  async createUser(username: string, password: string): Promise<Omit<User, 'password'>> {
    // Input validation
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error('Username is required');
    }
    
    if (!password || typeof password !== 'string' || password.trim() === '') {
      throw new Error('Password is required');
    }
    
    const users = await this.readUsers();
    const normalizedUsername = username.toLowerCase().trim();
    
    // Check if user already exists (case-insensitive check)
    if (users.some(u => u.username.toLowerCase() === normalizedUsername)) {
      throw new Error('Username already exists');
    }
    
    // Generate new user ID
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    const now = new Date();
    
    // Create user object with all required fields
    const user: User = {
      id,
      username: normalizedUsername,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    };
    
    try {
      // Add user to the array and save
      users.push(user);
      await this.writeUsers(users);
      
      // Return user without password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }
}

export const storage = new JsonFileStorage();