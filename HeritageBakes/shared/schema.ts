import { z } from "zod";

export interface Recipe {
  id: number;
  userId: number;
  title: string;
  ingredients: string[];
  directions: string;
  memory?: string | null;
  photo?: string | null;
  tags: string[];
  cookTime?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const insertRecipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  ingredients: z.array(z.string().min(1, "Ingredient cannot be empty")).min(1, "At least one ingredient is required"),
  directions: z.string().min(1, "Directions are required"),
  memory: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  cookTime: z.string().optional().nullable(),
  userId: z.number()
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export interface User {
  id: number;
  username: string;
  email?: string | null;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
