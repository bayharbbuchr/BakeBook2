import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecipeCard } from "@/components/recipe-card";
import { apiRequest } from "@/lib/queryClient";
import type { Recipe } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
  queryKey: ["/api/recipes"],
  queryFn: async () => {
    const response = await apiRequest('GET', '/api/recipes');
    return response.json();
  },
});

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = !searchQuery || 
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.memory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || selectedCategory === "all" || 
      recipe.tags?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const recipeCount = recipes.length;
  const memoriesCount = recipes.filter(r => r.memory).length;
  const nextCookbookProgress = (recipeCount % 20) / 20 * 100;
  const recipesUntilNext = 20 - (recipeCount % 20);

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-50 rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8 fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome to BakeBook!
            </h2>
            <p className="text-gray-700 text-base sm:text-lg">Your personal collection of favorite family recipes and memories</p>
            <div className="flex items-center mt-4 space-x-4 sm:space-x-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-floral-pink">{recipeCount}</div>
                <div className="text-xs sm:text-sm text-gray-600">Family Recipes</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-floral-pink">{memoriesCount}</div>
                <div className="text-xs sm:text-sm text-gray-600">Precious Memories</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-floral-pink">{Math.floor(recipeCount / 20)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Family Cookbooks</div>
              </div>
            </div>
          </div>
          
          {/* Cookbook Progress */}
          <div className="mt-6 md:mt-0 bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 w-full md:w-auto">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Next Family Cookbook</h3>
            <div className="flex items-center mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${nextCookbookProgress}%` }}
                ></div>
              </div>
              <span className="ml-3 text-xs sm:text-sm font-medium text-gray-700">
                {recipeCount % 20}/20
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              {recipesUntilNext === 20 ? "20" : recipesUntilNext} more recipes to create your family cookbook!
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 sm:h-5 w-4 sm:w-5" />
          <Input
            type="text"
            placeholder="Search your recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 sm:pl-12 h-10 sm:h-12 text-base sm:text-lg"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="flex-1 sm:flex-none sm:w-48 h-10 sm:h-12">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="dessert">Desserts</SelectItem>
              <SelectItem value="main-dish">Main Dishes</SelectItem>
              <SelectItem value="holiday">Holiday</SelectItem>
              <SelectItem value="family-favorite">Family Favorite</SelectItem>
              <SelectItem value="quick">Quick & Easy</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-10 sm:h-12 px-4 sm:px-6 bg-floral-pink hover:bg-floral-pink">
            <Filter className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-8 sm:py-16">
          <div className="text-5xl sm:text-6xl mb-4">📖</div>
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
            {recipes.length === 0 ? "Start Your Recipe Collection" : "No recipes found"}
          </h3>
          <p className="text-gray-600 mb-6 sm:mb-8 px-4 sm:px-0">
            {recipes.length === 0 
              ? "Add your favorite recipes and the special memories that make them meaningful to your family."
              : "Try adjusting your search or filters to find what you're looking for."
            }
          </p>
          <Link href="/add-recipe">
            <Button className="bg-floral-pink hover:bg-floral-purple text-base sm:text-lg px-6 sm:px-8 py-2 sm:py-3">
              <Plus className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
              Add Your First Recipe
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="text-center">
            <Link href="/add-recipe">
              <Button className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-floral-pink hover:bg-floral-purple text-white rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl">
                <Plus className="mr-2 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5" />
                Add Another Recipe
              </Button>
            </Link>
          </div>
        </>
      )}

      {/* Floating Action Button (Mobile) */}
      <Link href="/add-recipe">
        <Button className="fixed bottom-6 right-6 md:hidden w-14 h-14 sm:w-16 sm:h-16 bg-floral-pink hover:bg-floral-purple rounded-full shadow-lg hover:shadow-xl p-0 flex items-center justify-center">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </main>
  );
}
