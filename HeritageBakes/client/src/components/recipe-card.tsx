import { Link } from "wouter";
import { Clock, Heart, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Recipe } from "@shared/schema";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Card className="recipe-card bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {recipe.photo && (
        <img 
          src={recipe.photo} 
          alt={recipe.title}
          className="w-full h-40 sm:h-48 object-cover"
        />
      )}
      {!recipe.photo && (
        <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center">
          <span className="text-6xl">🍽️</span>
        </div>
      )}
      
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2">
            {recipe.title}
          </h3>
          <Heart className="h-5 w-5 text-bright-rose flex-shrink-0 ml-2" />
        </div>
        
        {recipe.memory && (
          <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2">
            "{recipe.memory}"
          </p>
        )}
        
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <div className="flex items-center text-xs sm:text-sm text-gray-500">
            <Clock className="mr-1 h-4 w-4" />
            <span>{recipe.cookTime || "No time specified"}</span>
          </div>
          <Link href={`/recipe/${recipe.id}`}>
            <button className="text-floral-pink hover:text-floral-purple text-sm sm:text-base font-medium flex items-center">
              View Recipe 
              <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          </Link>
        </div>
        
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mt-3 sm:mt-4">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag}
                className="px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{recipe.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
