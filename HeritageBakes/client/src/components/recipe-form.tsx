import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Save, Camera, Heart, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertRecipeSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { 
  addToOutbox, 
  saveRecipe, 
  getRecipes, 
  saveRecipes,
  processOutbox,
  OutboxItem
} from "@/offlineStorage";
import { v4 as uuidv4 } from 'uuid';

// Create a form schema that matches the UI
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  ingredientsList: z.string().min(1, "Ingredients are required"),
  directions: z.string().min(1, "Directions are required"),
  memory: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  cookTime: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

const tagOptions = [
  { id: "dessert", label: "Dessert" },
  { id: "holiday", label: "Holiday" },
  { id: "family-favorite", label: "Family Favorite" },
  { id: "main-dish", label: "Main Dish" },
  { id: "quick", label: "Quick & Easy" },
];

export function RecipeForm() {
  const [, setLocation] = useLocation();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  // Function to sync recipes when back online
  const syncRecipes = useCallback(async () => {
    if (!navigator.onLine) return;
    
    try {
      const { synced, errors } = await processOutbox();
      if (synced > 0) {
        queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${synced} recipe(s)`,
          variant: "default",
        });
      }
      if (errors > 0) {
        toast({
          title: "Sync Warning",
          description: `Failed to sync ${errors} recipe(s). Please check your connection and try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error syncing recipes:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync recipes. Please try again later.",
        variant: "destructive",
      });
    }
  }, [queryClient, toast]);

  // Track online/offline status and sync when back online
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      await syncRecipes();
      
      // Register for periodic sync if available
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('sync-recipes');
        } catch (error) {
          console.error('Error registering sync:', error);
        }
      }
    };

    const handleOffline = () => setIsOffline(true);

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync immediately if we're online
    if (navigator.onLine) {
      syncRecipes();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient, syncRecipes]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any, // Type assertion to fix the resolver type
    defaultValues: {
      title: "",
      ingredientsList: "",
      directions: "",
      memory: null,
      tags: [],
      cookTime: null,
    },
  });

  const createRecipeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!isAuthenticated || !user) {
        throw new Error('You must be logged in to create a recipe');
      }

      // Convert ingredients from textarea to array
      const ingredients = formData.ingredientsList
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Generate a temporary ID for offline use
      const tempId = `temp_${uuidv4()}`;
      const now = new Date().toISOString();
      
      const recipeData = {
        id: tempId,
        title: formData.title,
        ingredients,
        directions: formData.directions,
        memory: formData.memory || null,
        tags: formData.tags || [],
        cookTime: formData.cookTime || null,
        createdAt: now,
        updatedAt: now,
        userId: user.id,
        // Add placeholder for photo URL if needed
        photoUrl: photoFile ? `local:${tempId}` : null,
      };

      // If we're offline or the request fails, save locally and queue for sync
      const saveOffline = async () => {
        // Save the recipe to local storage
        await saveRecipe(recipeData);
        
        // Add to outbox for syncing
        await addToOutbox({
          type: 'create',
          data: recipeData
        });
        
        // Update the recipes query cache
        const currentRecipes = await getRecipes();
        queryClient.setQueryData(['/api/recipes'], [...currentRecipes, recipeData]);
        
        return recipeData;
      };

      // If we're offline, save locally and return
      if (isOffline) {
        return saveOffline();
      }

      try {
        // Try to save to server
        let response;
        
        if (photoFile) {
          // Handle file upload with FormData
          const formDataObj = new FormData();
          formDataObj.append('title', formData.title);
          formDataObj.append('ingredients', JSON.stringify(ingredients));
          formDataObj.append('directions', formData.directions);
          
          if (formData.memory) {
            formDataObj.append('memory', formData.memory);
          }
          
          if (formData.tags?.length) {
            formDataObj.append('tags', JSON.stringify(formData.tags));
          }
          
          if (formData.cookTime) {
            formDataObj.append('cookTime', formData.cookTime);
          }
          
          formDataObj.append('photo', photoFile);

          const token = localStorage.getItem('token');
          if (!token) throw new Error('Authentication token not found');
          
          response = await fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formDataObj,
            credentials: 'include',
          });
        } else {
          // No file, use regular JSON
          response = await fetch('/api/recipes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(recipeData),
            credentials: 'include',
          });
        }

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || 'Failed to create recipe');
        }

        const result = await response.json();
        
        // Update local cache with server response
        const currentRecipes = await getRecipes();
        const updatedRecipes = currentRecipes.filter(r => r.id !== tempId);
        updatedRecipes.push(result);
        await saveRecipes(updatedRecipes);
        
        return result;
        
      } catch (error) {
        console.error('Error saving to server, falling back to offline:', error);
        // If we're offline or the request fails, save locally
        return saveOffline();
      }
    },
    onSuccess: (data, variables, context) => {
      // Only invalidate if we're online and the save was successful
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      }
      
      toast({
        title: isOffline ? "Saved Offline" : "Success!",
        description: isOffline 
          ? "Recipe saved locally and will sync when you're back online."
          : "Recipe saved successfully!",
      });
      
      setLocation('/');
    },
    onError: (error) => {
      console.error('Error in createRecipeMutation:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createRecipeMutation.mutateAsync(data);
      toast({
        title: "Success",
        description: "Recipe created successfully!",
        variant: "default",
      });
      setLocation("/"); // Redirect to home page after successful submission
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create recipe';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Show offline/sync status indicator
  const renderStatusIndicator = () => {
    const isSyncing = createRecipeMutation.isPending;
    
    return (
      <div className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg ${
        isOffline ? 'bg-yellow-500' : isSyncing ? 'bg-blue-500' : 'bg-green-500'
      } text-white flex items-center space-x-2`}>
        {isOffline ? (
          <>
            <WifiOff className="h-5 w-5" />
            <span>Working Offline</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Wifi className="h-5 w-5" />
            <span>Online</span>
          </>
        )}
      </div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {renderStatusIndicator()}
        {/* Recipe Name */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base sm:text-lg font-semibold">Recipe Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Grandma's Apple Pie"
                  className="h-10 sm:h-12 text-base sm:text-lg"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Photo Upload */}
        <div>
          <Label className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 block">Recipe Photo</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-4 sm:p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="cursor-pointer">
              {photoPreview ? (
                <div className="space-y-4">
                  <img 
                    src={photoPreview} 
                    alt="Recipe preview" 
                    className="max-w-full h-36 sm:h-48 object-cover rounded-lg mx-auto"
                  />
                  <p className="text-sm text-gray-600">Click to change photo</p>
                </div>
              ) : (
                <>
                  <Camera className="text-gray-400 mx-auto mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12" />
                  <p className="text-gray-600 text-sm sm:text-base mb-2">Click to upload a photo</p>
                  <p className="text-xs sm:text-sm text-gray-500">PNG, JPG up to 10MB</p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Ingredients */}
        <FormField
          control={form.control}
          name="ingredientsList"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base sm:text-lg font-semibold">Ingredients *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Type each ingredient on a new line:&#10;2 cups all-purpose flour&#10;1/2 cup butter, softened&#10;6 large apples, peeled and sliced"
                    rows={6}
                    className="text-base sm:text-lg resize-none recipe-input"
                    {...field}
                  />
                  {field.value && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="text-sm font-medium text-purple-800 mb-2">Preview:</h4>
                      <ul className="recipe-list">
                        {field.value.split('\n').filter(line => line.trim()).map((ingredient, index) => (
                          <li key={index} className="recipe-list-item text-purple-700">
                            {ingredient.trim()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Directions */}
        <FormField
          control={form.control}
          name="directions"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base sm:text-lg font-semibold">Directions *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Describe the step-by-step process:&#10;1. Preheat oven to 350°F...&#10;2. Mix flour and butter until crumbly...&#10;3. Roll out the dough and place in pie dish..."
                    rows={8}
                    className="text-base sm:text-lg resize-none recipe-input"
                    {...field}
                  />
                  {field.value && (
                    <div className="mt-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
                      <h4 className="text-sm font-medium text-pink-800 mb-2">Preview:</h4>
                      <div className="recipe-list">
                        {field.value.split('\n').filter(line => line.trim()).map((step, index) => {
                          const trimmedStep = step.trim();
                          const startsWithNumber = /^\d+\.?\s*/.test(trimmedStep);
                          
                          return (
                            <div key={index} className="recipe-list-item text-pink-700">
                              {startsWithNumber ? trimmedStep : `${index + 1}. ${trimmedStep}`}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cook Time */}
        <FormField
          control={form.control}
          name="cookTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base sm:text-lg font-semibold">Cook Time</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 45 minutes, 1 hour 30 minutes"
                  className="h-10 sm:h-12 text-base sm:text-lg"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Memory Prompt */}
        <div className="bg-purple-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <FormField
            control={form.control}
            name="memory"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base sm:text-lg font-semibold flex items-center">
                  <Heart className="text-bright-rose mr-2 h-5 w-5" />
                  Share a Special Memory
                </FormLabel>
                <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">
                  What makes this recipe special? Tell us about a cherished moment, tradition, or story connected to this dish.
                </p>
                <FormControl>
                  <Textarea
                    placeholder="I remember making this with my grandmother every Christmas morning. She would let me help roll the dough, and the kitchen would fill with the most wonderful aroma..."
                    rows={4}
                    className="text-base sm:text-lg resize-none recipe-input"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel className="text-base sm:text-lg font-semibold">Recipe Tags</FormLabel>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {tagOptions.map((tag) => (
                  <FormField
                    key={tag.id}
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              const currentTags = field.value || [];
                              if (checked) {
                                field.onChange([...currentTags, tag.id]);
                              } else {
                                field.onChange(currentTags.filter((t) => t !== tag.id));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {tag.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation('/')}
            className="flex-1 h-10 sm:h-12 text-base sm:text-lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createRecipeMutation.isPending}
            className="flex-1 h-10 sm:h-12 text-base sm:text-lg bg-warm-orange hover:bg-orange-600"
          >
            {createRecipeMutation.isPending ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Recipe
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
