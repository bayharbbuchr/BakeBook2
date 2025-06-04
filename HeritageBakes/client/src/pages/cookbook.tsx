import { useQuery } from "@tanstack/react-query";
import { Book, Download, Eye, Share, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CookbookPreview } from "@/components/cookbook-preview";
import { generatePDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Recipe } from "@shared/schema";

export default function Cookbook() {
  const { toast } = useToast();
  
  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/recipes');
      return response.json();
    },
  });

  const recipeCount = recipes.length;
  const nextCookbookProgress = (recipeCount % 20) / 20 * 100;
  const recipesUntilNext = recipeCount >= 20 ? 0 : 20 - (recipeCount % 20);
  const canCreateCookbook = recipeCount >= 10;

  const handleGeneratePDF = async () => {
    try {
      await generatePDF(recipes, "BakeBook Recipe Collection");
      toast({
        title: "Success!",
        description: "Your cookbook PDF has been downloaded!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF cookbook",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-20 bg-gray-200 rounded-2xl mb-8"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 rounded-2xl"></div>
            <div className="h-80 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cookbook Header */}
      <div className="text-center mb-8">
        <Book className="text-warm-orange mx-auto mb-4 h-16 w-16" />
        <h2 className="text-4xl font-bold text-gray-900 mb-4">My Recipe Cookbook</h2>
        <p className="text-xl text-gray-600">Create beautiful cookbooks to share with family and friends</p>
      </div>

      {/* Cookbook Options */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Current Cookbook */}
        <Card className="p-6">
          <div className="cookbook-preview rounded-xl p-8 text-white text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">BakeBook Recipe Collection</h3>
            <p className="text-lg opacity-90">Volume 1 • {recipeCount} Recipes</p>
            <div className="mt-4">
              <Book className="mx-auto h-12 w-12" />
            </div>
          </div>
          <div className="space-y-3">
            <Button
              onClick={handleGeneratePDF}
              disabled={!canCreateCookbook}
              className="w-full bg-warm-orange hover:bg-orange-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF Cookbook
            </Button>
            <CookbookPreview recipes={recipes}>
              <Button variant="outline" className="w-full border-warm-orange text-warm-orange hover:bg-warm-orange hover:text-white">
                <Eye className="mr-2 h-4 w-4" />
                Preview Cookbook
              </Button>
            </CookbookPreview>
            <Button variant="outline" className="w-full">
              <Share className="mr-2 h-4 w-4" />
              Share with Family
            </Button>
          </div>
          {!canCreateCookbook && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              You need at least 10 recipes to create a cookbook
            </p>
          )}
        </Card>

        {/* Next Cookbook Progress */}
        <Card className="p-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Next Cookbook</h3>
          <div className="text-center mb-6">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="#E5E7EB" strokeWidth="8" fill="none"/>
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  stroke="#F97316" 
                  strokeWidth="8" 
                  fill="none" 
                  strokeDasharray="314" 
                  strokeDashoffset={314 - (314 * nextCookbookProgress / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-warm-orange">
                  {Math.round(nextCookbookProgress)}%
                </span>
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {recipeCount % 20} of 20 recipes
            </p>
            <p className="text-gray-600">
              {recipesUntilNext === 0 
                ? "Ready to create your next cookbook!" 
                : `${recipesUntilNext} more recipes to unlock your next cookbook`
              }
            </p>
          </div>
          <div className="space-y-3">
            <Link href="/add">
              <Button variant="secondary" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add More Recipes
              </Button>
            </Link>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Keep adding recipes to build your next beautiful cookbook!
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recipe Selection for Cookbook */}
      {recipes.length > 0 && (
        <Card className="p-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Your Recipe Collection</h3>
          <div className="space-y-4">
            {recipes.map((recipe) => (
              <div 
                key={recipe.id}
                className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Checkbox checked readOnly className="mr-4" />
                <div className="flex-1 flex items-center">
                  {recipe.photo ? (
                    <img 
                      src={recipe.photo} 
                      alt={recipe.title}
                      className="w-16 h-16 object-cover rounded-lg mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg mr-4 flex items-center justify-center">
                      <span className="text-2xl">🍽️</span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900">{recipe.title}</h4>
                    <p className="text-sm text-gray-600">
                      {recipe.tags.join(" • ") || "No tags"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}
