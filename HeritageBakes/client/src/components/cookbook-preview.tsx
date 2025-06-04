import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Recipe } from "@shared/schema";

interface CookbookPreviewProps {
  recipes: Recipe[];
  children: React.ReactNode;
}

export function CookbookPreview({ recipes, children }: CookbookPreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            BakeBook Recipe Collection Preview
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-8">
            {/* Cover Page */}
            <div className="text-center py-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                BakeBook Recipe Collection
              </h1>
              <p className="text-xl text-gray-700 mb-2">Volume 1</p>
              <p className="text-lg text-gray-600">{recipes.length} Cherished Recipes</p>
              <div className="mt-8 text-6xl">📖</div>
            </div>

            {/* Table of Contents */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Table of Contents</h2>
              <div className="space-y-2">
                {recipes.map((recipe, index) => (
                  <div key={recipe.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-medium">{recipe.title}</span>
                    <span className="text-gray-500">Page {index + 3}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipe Pages */}
            {recipes.map((recipe, index) => (
              <div key={recipe.id} className="break-inside-avoid">
                <div className="bg-white border border-gray-200 rounded-lg p-8">
                  {/* Recipe Header */}
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h2>
                    {recipe.cookTime && (
                      <p className="text-gray-600">Cooking Time: {recipe.cookTime}</p>
                    )}
                  </div>

                  {/* Recipe Photo */}
                  {recipe.photo && (
                    <div className="mb-6">
                      <img 
                        src={recipe.photo} 
                        alt={recipe.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Memory */}
                  {recipe.memory && (
                    <div className="mb-6 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <h3 className="font-semibold text-gray-900 mb-2">A Special Memory</h3>
                      <p className="text-gray-700 italic">"{recipe.memory}"</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Ingredients */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h3>
                      <ul className="space-y-2">
                        {recipe.ingredients.map((ingredient, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Directions */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Directions</h3>
                      <div className="prose prose-sm">
                        <p className="whitespace-pre-line">{recipe.directions}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {recipe.tags.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {recipe.tags.map((tag) => (
                          <span 
                            key={tag}
                            className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Page Number */}
                  <div className="text-center mt-8 pt-4 border-t border-gray-200">
                    <span className="text-gray-500">Page {index + 3}</span>
                  </div>
                </div>
                
                {index < recipes.length - 1 && <Separator className="my-8" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
