const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api'; // Changed to port 5000

async function register(username, password) {
  const res = await axios.post(`${BASE_URL}/auth/register`, { username, password });
  return res.data.token;
}

async function login(username, password) {
  const res = await axios.post(`${BASE_URL}/auth/login`, { username, password });
  return res.data.token;
}

async function createRecipe(token, recipe) {
  const res = await axios.post(`${BASE_URL}/recipes`, recipe, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

async function getRecipes(token) {
  const res = await axios.get(`${BASE_URL}/recipes`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

async function getRecipesNoAuth() {
  try {
    await axios.get(`${BASE_URL}/recipes`);
  } catch (e) {
    return e.response.status;
  }
}

(async () => {
  // Register users
  const user1 = { username: 'alice', password: 'password123' };
  const user2 = { username: 'bob', password: 'password456' };

  console.log('Registering users...');
  const token1 = await register(user1.username, user1.password);
  const token2 = await register(user2.username, user2.password);

  // Create recipes
  console.log('Creating recipes...');
  const recipe1 = await createRecipe(token1, {
    title: "Alice's Pie",
    ingredients: ['apples', 'sugar', 'flour'],
    directions: 'Mix and bake.',
    memory: 'Grandma’s favorite.',
    tags: ['dessert'],
    cookTime: '45 minutes'
  });

  const recipe2 = await createRecipe(token2, {
    title: "Bob's Cookies",
    ingredients: ['chocolate', 'flour', 'sugar'],
    directions: 'Mix and bake.',
    memory: 'Childhood treat.',
    tags: ['dessert'],
    cookTime: '30 minutes'
  });

  // Fetch recipes as Alice
  console.log('Fetching recipes as Alice...');
  const aliceRecipes = await getRecipes(token1);
  console.log('Alice sees:', aliceRecipes.map(r => r.title));

  // Fetch recipes as Bob
  console.log('Fetching recipes as Bob...');
  const bobRecipes = await getRecipes(token2);
  console.log('Bob sees:', bobRecipes.map(r => r.title));

  // Fetch recipes with no auth
  console.log('Fetching recipes with no auth...');
  const noAuthStatus = await getRecipesNoAuth();
  console.log('No auth status:', noAuthStatus);

  // Results
  console.log('\nTest Results:');
  console.log('- Alice should only see her own recipe.');
  console.log('- Bob should only see his own recipe.');
  console.log('- Unauthenticated requests should be denied (401).');
})();
