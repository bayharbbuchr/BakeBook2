import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Navbar } from "@/components/navbar";
import Home from "@/pages/home";
import AddRecipe from "@/pages/add-recipe";
import Cookbook from "@/pages/cookbook";
import RecipeDetail from "@/pages/recipe-detail";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import NotFound from "@/pages/not-found";
import { UpdateNotification } from "@/components/UpdateNotification";
import { useEffect } from "react";
import { register, getRegistration } from "./serviceWorkerRegistration";

function Router() {
  // Handle service worker updates
  useEffect(() => {
    register({
      onUpdate: (registration) => {
        // New update available
        console.log('New version available!');
      },
      onSuccess: () => {
        console.log('App is ready for offline use!');
      },
    });

    // Cleanup on unmount
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(r => {
            if (r !== getRegistration()) {
              r.unregister();
            }
          });
        });
      }
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <UpdateNotification />
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>
        <Route path="/add-recipe">
          <ProtectedRoute>
            <AddRecipe />
          </ProtectedRoute>
        </Route>
        <Route path="/cookbook">
          <ProtectedRoute>
            <Cookbook />
          </ProtectedRoute>
        </Route>
        <Route path="/recipe/:id">
          <ProtectedRoute>
            <RecipeDetail />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
