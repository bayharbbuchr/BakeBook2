import { get, set, del, createStore, keys } from 'idb-keyval';

// Create a store for our data
const store = createStore('heritage-bakes-db', 'keyval-store');

// User info
export const saveUser = (user: any) => set('user', user, store);
export const getUser = () => get<any>('user', store);
export const clearUser = () => del('user', store);

// Auth token
export const saveToken = (token: string) => set('token', token, store);
export const getToken = () => get<string>('token', store);
export const clearToken = () => del('token', store);

// Recipes
export const saveRecipes = (recipes: any[]) => set('recipes', recipes, store);
export const getRecipes = () => get<any[]>('recipes', store).then(recipes => recipes || []);

// Recipe by ID
export const saveRecipe = async (recipe: any) => {
  const recipes = await getRecipes();
  const existingIndex = recipes.findIndex(r => r.id === recipe.id);
  if (existingIndex >= 0) {
    recipes[existingIndex] = recipe;
  } else {
    recipes.push(recipe);
  }
  await saveRecipes(recipes);
  return recipe;
};

export const getRecipe = async (id: string) => {
  const recipes = await getRecipes();
  return recipes.find(recipe => recipe.id === id);
};

export const deleteRecipe = async (id: string) => {
  const recipes = await getRecipes();
  const updatedRecipes = recipes.filter(recipe => recipe.id !== id);
  await saveRecipes(updatedRecipes);
  return id;
};

// Outbox for offline mutations
export interface OutboxItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  error?: string;
}

export const addToOutbox = async (item: Omit<OutboxItem, 'id' | 'status' | 'timestamp'>) => {
  const outbox = await getOutbox();
  const id = `offline_${Date.now()}`;
  const newItem: OutboxItem = {
    ...item,
    id,
    status: 'pending',
    timestamp: Date.now(),
  };
  await set('outbox', [...outbox, newItem], store);
  return id;
};

export const getOutbox = (): Promise<OutboxItem[]> => 
  get<OutboxItem[]>('outbox', store).then(outbox => outbox || []);

export const updateOutboxItem = async (id: string, updates: Partial<OutboxItem>) => {
  const outbox = await getOutbox();
  const index = outbox.findIndex(item => item.id === id);
  if (index === -1) return null;
  
  const updatedItem = { ...outbox[index], ...updates };
  outbox[index] = updatedItem;
  await set('outbox', outbox, store);
  return updatedItem;
};

export const removeFromOutbox = async (id: string) => {
  const outbox = await getOutbox();
  const updatedOutbox = outbox.filter(item => item.id !== id);
  await set('outbox', updatedOutbox, store);
  return id;
};

// Clear all offline data (on logout)
export const clearOfflineData = () => {
  return Promise.all([
    clearUser(),
    clearToken(),
    del('outbox', store),
    // Keep recipes in cache even after logout
  ]);
};

// Sync helper
export const processOutbox = async () => {
  if (!navigator.onLine) return { synced: 0, errors: 0 };
  
  const outbox = await getOutbox();
  const pendingItems = outbox.filter(item => item.status === 'pending');
  
  let synced = 0;
  let errors = 0;
  
  for (const item of pendingItems) {
    try {
      // Mark as syncing
      await updateOutboxItem(item.id, { status: 'syncing' });
      
      // Get fresh token for each request
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Process based on type
      switch (item.type) {
        case 'create':
        case 'update': {
          const { id: _, ...data } = item.data;
          const method = item.type === 'create' ? 'POST' : 'PUT';
          const url = item.type === 'create' 
            ? '/api/recipes' 
            : `/api/recipes/${item.data.id}`;
            
          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }
          
          const result = await response.json();
          
          // If this was a create, update the local ID mapping
          if (item.type === 'create' && result.id !== item.data.id) {
            // Update any references to the offline ID
            const recipes = await getRecipes();
            const recipeIndex = recipes.findIndex(r => r.id === item.data.id);
            if (recipeIndex >= 0) {
              recipes[recipeIndex] = {
                ...recipes[recipeIndex],
                id: result.id,
              };
              await saveRecipes(recipes);
            }
          }
          
          break;
        }
        case 'delete':
          await fetch(`/api/recipes/${item.data.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
          });
          // Even if delete fails on server (maybe already deleted), we consider it a success
          break;
      }
      
      // Mark as synced and remove from outbox
      await removeFromOutbox(item.id);
      synced++;
      
    } catch (error) {
      console.error(`Failed to sync ${item.type} operation:`, error);
      await updateOutboxItem(item.id, { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      errors++;
    }
  }
  
  return { synced, errors };
};
