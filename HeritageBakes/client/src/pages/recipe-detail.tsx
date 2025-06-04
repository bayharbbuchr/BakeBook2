import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, Trash2, Clock, Heart, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Recipe } from "@shared/schema";

export default function RecipeDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipe, isLoading, error } = useQuery<Recipe>({
    queryKey: ["/api/recipes", id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/recipes/${id}`);
      return response.json();
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/recipes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Success!",
        description: "Recipe deleted successfully.",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete recipe.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-2xl mb-8"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !recipe) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Recipe not found</h3>
          <p className="text-gray-600 mb-8">The recipe you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation("/")} className="bg-warm-orange hover:bg-orange-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteRecipeMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Recipe Content */}
      <div className="space-y-8">
        {/* Title and Image */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{recipe.title}</h1>
          {recipe.cookTime && (
            <div className="flex items-center justify-center text-gray-600 mb-6">
              <Clock className="mr-2 h-5 w-5" />
              <span className="text-lg">{recipe.cookTime}</span>
            </div>
          )}
          
          {recipe.photo && (
            <img 
              src={recipe.photo} 
              alt={recipe.title}
              className="w-full max-w-2xl mx-auto h-96 object-cover rounded-2xl shadow-lg"
            />
          )}
        </div>

        {/* Memory */}
        {recipe.memory && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-start">
                <Heart className="text-warm-red mr-3 h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">A Special Memory</h3>
                  <p className="text-gray-700 text-lg italic leading-relaxed">
                    "{recipe.memory}"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ingredients and Directions */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Ingredients */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ingredients</h3>
              <ul className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-warm-orange mr-3 text-lg">•</span>
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Directions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Directions</h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {recipe.directions}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Tag className="text-gray-600 mr-2 h-5 w-5" />
                <h3 className="text-xl font-semibold text-gray-900">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
