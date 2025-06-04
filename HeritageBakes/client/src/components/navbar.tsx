import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Home, Plus, Book, X, Menu, LogIn, LogOut, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  
  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const recipeCount = recipes.length;
  const showBadge = recipeCount >= 10;
  
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <BookOpen className="text-floral-pink text-2xl mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">BakeBook</h1>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/">
              <button className={`flex items-center font-medium transition-colors ${
                location === "/" 
                  ? "text-floral-pink border-b-2 border-floral-pink pb-1" 
                  : "text-gray-600 hover:text-floral-pink"
              }`}>
                <Home className="mr-2 h-4 w-4" />
                My Recipes
              </button>
            </Link>
            
            <Link href="/add-recipe">
              <button className={`flex items-center font-medium transition-colors ${
                location === "/add-recipe" 
                  ? "text-floral-pink border-b-2 border-floral-pink pb-1" 
                  : "text-gray-600 hover:text-floral-pink"
              }`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Recipe
              </button>
            </Link>
            
            <Link href="/cookbook">
              <button className={`flex items-center font-medium transition-colors relative ${
                location === "/cookbook" 
                  ? "text-floral-pink border-b-2 border-floral-pink pb-1" 
                  : "text-gray-600 hover:text-floral-pink"
              }`}>
                <Book className="mr-2 h-4 w-4" />
                My Cookbook
                {showBadge && (
                  <span className="absolute -top-2 -right-2 bg-bright-rose text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {Math.floor(recipeCount / 10)}
                  </span>
                )}
              </button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden text-gray-600 hover:text-floral-pink p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-floral-pink"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          
          <div className="hidden md:flex items-center ml-8">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="h-8 w-8 rounded-full bg-floral-pink/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-floral-pink" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      {user?.email && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline" className="ml-4">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} border-t border-gray-200`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white">
          <Link 
            href="/" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/" ? "bg-floral-pink/10 text-floral-pink" : "text-gray-700 hover:bg-gray-50 hover:text-floral-pink"}`}
            onClick={closeMobileMenu}
          >
            <div className="flex items-center">
              <Home className="h-5 w-5 mr-2" />
              <span>My Recipes</span>
            </div>
          </Link>
          
          <Link 
            href="/add-recipe" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/add-recipe" ? "bg-floral-pink/10 text-floral-pink" : "text-gray-700 hover:bg-gray-50 hover:text-floral-pink"}`}
            onClick={closeMobileMenu}
          >
            <div className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              <span>Add Recipe</span>
            </div>
          </Link>
          
          <Link 
            href="/cookbook" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/cookbook" ? "bg-floral-pink/10 text-floral-pink" : "text-gray-700 hover:bg-gray-50 hover:text-floral-pink"}`}
            onClick={closeMobileMenu}
          >
            <div className="flex items-center relative">
              <Book className="h-5 w-5 mr-2" />
              <span>My Cookbook</span>
              {showBadge && (
                <span className="absolute -top-2 left-6 bg-bright-rose text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {Math.floor(recipeCount / 10)}
                </span>
              )}
            </div>
          </Link>
          
          {isAuthenticated ? (
            <>
              <DropdownMenuSeparator className="my-1" />
              <button
                onClick={() => {
                  logout();
                  closeMobileMenu();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-floral-pink"
              >
                <div className="flex items-center">
                  <LogOut className="h-5 w-5 mr-2" />
                  <span>Sign out</span>
                </div>
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-floral-pink"
              onClick={closeMobileMenu}
            >
              <div className="flex items-center">
                <LogIn className="h-5 w-5 mr-2" />
                <span>Sign in</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
