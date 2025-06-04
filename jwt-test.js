const axios = require('axios');
function decodeJwtPayload(token) {
  const payload = token.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

const BASE_URL = 'http://localhost:5000/api';

async function login(username, password) {
  const res = await axios.post(`${BASE_URL}/auth/login`, { username, password });
  return res.data.token;
}

async function getRecipes(token) {
  const res = await axios.get(`${BASE_URL}/recipes`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

(async () => {
  const users = [
    { username: 'alice', password: 'password123' },
    { username: 'bob', password: 'password456' }
  ];

  for (const user of users) {
    console.log(`\nLogging in as ${user.username}...`);
    const token = await login(user.username, user.password);
    const decoded = decodeJwtPayload(token);
    console.log('JWT:', token);
    console.log('Decoded payload:', decoded);

    const recipes = await getRecipes(token);
    console.log(`${user.username} sees recipes:`, recipes.map(r => r.title));
  }
})();
