const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

const SECRET = 'mysecret';

// Middleware for Auth
function auth(role = null) {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send('Unauthorized');
    try {
      const data = jwt.verify(token, SECRET);
      req.user = data;
      if (role && data.role !== role) return res.status(403).send('Forbidden');
      next();
    } catch {
      res.status(401).send('Invalid Token');
    }
  };
}

// Signup route
app.post('/signup', async (req, res) => {
  const { name, email, password, address, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, address, role, password: hash } });
  res.json(user);
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).send('Invalid Credentials');
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
  res.json({ token });
});

// Get all stores with avg rating
app.get('/stores', auth(), async (req, res) => {
  const stores = await prisma.store.findMany({ include: { ratings: true } });
  res.json(stores.map(store => ({
    ...store,
    avgRating: avg(store.ratings.map(r => r.value))
  })));
});

// Submit or update rating
app.post('/rate', auth(), async (req, res) => {
  const { storeId, value } = req.body;
  const existing = await prisma.rating.findFirst({ where: { storeId, userId: req.user.id } });
  if (existing) {
    await prisma.rating.update({ where: { id: existing.id }, data: { value } });
  } else {
    await prisma.rating.create({ data: { value, storeId, userId: req.user.id } });
  }
  res.send('Rating saved');
});

// Helper function to get average
function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Start server
app.listen(4000, () => console.log('✅ Server running on http://localhost:4000'));

