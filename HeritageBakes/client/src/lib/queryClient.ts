import { QueryClient, QueryFunction, QueryKey } from "@tanstack/react-query";
import { getRecipes, saveRecipes } from '../offlineStorage';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper to determine if a query is for recipes
function isRecipesQuery(queryKey: QueryKey): boolean {
  return (
    Array.isArray(queryKey) && 
    queryKey.some(key => 
      typeof key === 'string' && 
      (key === '/api/recipes' || key.startsWith('/api/recipes/'))
    )
  );
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Prepend the base URL if the URL is relative
  const fullUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || ''}${url}`;
  // Get the authentication token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Prepare headers
  const headers: HeadersInit = {};
  
  // Set Content-Type for non-GET requests with data
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('Making API request:', { method, url, headers });
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  return async ({ queryKey }) => {
    const isOffline = !navigator.onLine;
    const isRecipeQuery = isRecipesQuery(queryKey);
    
    // If offline and this is a recipe query, try to get from cache first
    if (isOffline && isRecipeQuery) {
      console.log('Offline mode: Attempting to load recipes from cache');
      const cachedRecipes = await getRecipes();
      if (cachedRecipes) {
        console.log('Using cached recipes:', cachedRecipes);
        return cachedRecipes as T;
      }
    }
    
    // Get the authentication token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Prepare headers
    const headers: HeadersInit = {};
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = (queryKey[0] as string).startsWith('http') 
      ? queryKey[0] as string 
      : `${import.meta.env.VITE_API_URL || ''}${queryKey[0]}`;
      
    console.log('Making query request:', { url, headers });
    
    try {
      const res = await fetch(url, {
        headers,
        credentials: "include",
      });

      if (options.on401 === "returnNull" && res.status === 401) {
        console.log('Unauthorized request, returning null');
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Cache the recipes data if this is a recipes query
      if (isRecipeQuery && Array.isArray(data)) {
        await saveRecipes(data);
      }
      
      return data;
    } catch (error) {
      // If we're offline and have cached data, return that instead of failing
      if (isOffline && isRecipeQuery) {
        const cachedRecipes = await getRecipes();
        if (cachedRecipes) {
          console.log('Network error, using cached recipes');
          return cachedRecipes as T;
        }
      }
      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
