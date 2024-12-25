const { MongoClient } = require('mongodb');
const csv = require('csv-parser');
const fs = require('fs');

const mongoURI = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string
const dbName = 'toll-interop-db';
const client = new MongoClient(mongoURI);

async function importTollStations() {
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log('Connected to MongoDB');

    const tollStations = db.collection('toll_stations');
    const operators = db.collection('operators');

    // Keep track of the last used TollID number for each operator
    const operatorTollIdCounters = {};

    // Ensure unique index on TollID for toll_stations collection
    await tollStations.createIndex({ TollID: 1 }, { unique: true });

    // Use a Promise to track all insert operations
    const insertPromises = [];

    // Read and process the CSV file
    fs.createReadStream('sweng2024b-tollstations-source-data.csv')
      .pipe(csv())
      .on('data', (row) => {
        // 1. Generate TollID
        const opId = row['OpID'];
        if (!operatorTollIdCounters[opId]) {
          operatorTollIdCounters[opId] = 1;
        } else {
          operatorTollIdCounters[opId]++;
        }
        const tollId = `${opId}${operatorTollIdCounters[opId].toString().padStart(2, '0')}`;

        // 2. Clean and transform data
        const cleanRow = {
          TollID: tollId,
          Name: row['Name'].trim(), // Remove extra whitespace
          Locality: row['Locality'].trim(),
          Road: row['Road'].trim(),
          Latitude: parseFloat(row['Lat']),
          Longitude: parseFloat(row['Long']),
          Operator: row['Operator'].trim(),
          OpID: opId,
          Email: row['Email'].trim(),
          Price1: parseFloat(row['Price1']),
          Price2: parseFloat(row['Price2']),
          Price3: parseFloat(row['Price3']),
          Price4: parseFloat(row['Price4']),
        };

        // 3. Insert into toll_stations collection (push the Promise to the array)
        const insertPromise = tollStations.insertOne(cleanRow)
          .then(() => console.log(`Inserted toll station: ${tollId}`))
          .catch(err => {
            if (err.code === 11000) { // Duplicate key error
              console.error(`Skipping duplicate TollID: ${tollId}`);
            } else {
              console.error('Error inserting toll station:', err);
            }
          });
        insertPromises.push(insertPromise);

        // 4. Insert operator into operators collection (if it doesn't exist)
        const operatorPromise = operators.findOne({ OpID: opId })
          .then(operatorExists => {
            if (!operatorExists) {
              return operators.insertOne({
                OpID: opId,
                Operator: row['Operator'].trim(),
                Email: row['Email'].trim(),
              });
            }
            return Promise.resolve(); // Operator already exists
          })
          .then(() => console.log(`Inserted operator: ${opId}`))
          .catch(err => console.error('Error inserting operator:', err));
        insertPromises.push(operatorPromise);
      })
      .on('end', async () => {
        // Wait for all insert operations to complete
        await Promise.all(insertPromises);

        console.log('Finished processing CSV file.');
        client.close(); // Close the connection AFTER all operations are done
      });
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

importTollStations();
