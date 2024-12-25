const express = require('express');
const router = express.Router();

// GET /api/admin/healthcheck
router.get('/admin/healthcheck', async (req, res) => {
    const db = req.db; // Access the database connection from the request object
  try {
    // Test database connection
    const dbResult = await db.command({ ping: 1 }); // Simple ping command

    // Get data for response (replace with actual queries)
    const numStations = await db.collection('toll_stations').countDocuments();
    const numTags = await db.collection('tags').countDocuments();
    const numPasses = await db.collection('passes').countDocuments();

    res.status(200).json({
      status: 'OK',
      dbconnection: 'Successfully connected to MongoDB', // Modify as needed
      n_stations: numStations,
      n_tags: numTags,
      n_passes: numPasses,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({
      status: 'failed',
      dbconnection: 'Failed to connect to MongoDB', // Modify as needed
    });
  }
});

// ... other admin routes (resetstations, resetpasses, addpasses)

module.exports = router;
