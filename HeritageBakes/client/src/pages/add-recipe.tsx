import { RecipeForm } from "@/components/recipe-form";
import { Utensils } from "lucide-react";

export default function AddRecipe() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <Utensils className="text-warm-orange mx-auto mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Add a New Recipe</h2>
          <p className="text-gray-600 text-base sm:text-lg">Share your culinary memories with future generations</p>
        </div>

        <RecipeForm />
      </div>
    </main>
  );
}
