const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb'); // MongoDB driver
const app = express();
const port = 9115; // From your specifications

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string
const dbName = 'toll-interop-db'; // Replace with your database name
const client = new MongoClient(mongoURI);

let db; // Global variable to hold the database connection

async function connectToMongo() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

connectToMongo(); // Call the function to establish the connection

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes (to be created in the next steps)
const adminRoutes = require('./routes/admin');
const tollStationPassesRoutes = require('./routes/tollStationPasses');
const passAnalysisRoutes = require('./routes/passAnalysis');
const passesCostRoutes = require('./routes/passesCost');
const chargesByRoutes = require('./routes/chargesBy');

// Use routes with database connection
app.use('/api', (req, res, next) => {
  req.db = db; // Pass the database connection to the routes
  next();
}, adminRoutes);
app.use('/api', (req, res, next) => {
  req.db = db; // Pass the database connection to the routes
  next();
}, tollStationPassesRoutes);
app.use('/api', (req, res, next) => {
  req.db = db; // Pass the database connection to the routes
  next();
}, passAnalysisRoutes);
app.use('/api', (req, res, next) => {
  req.db = db; // Pass the database connection to the routes
  next();
}, passesCostRoutes);
app.use('/api', (req, res, next) => {
  req.db = db; // Pass the database connection to the routes
  next();
}, chargesByRoutes);

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
