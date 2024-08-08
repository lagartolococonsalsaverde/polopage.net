const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db('qadb'); // Make sure this matches your database name
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    if (error.name === 'MongoServerSelectionError') {
      console.error('Unable to select a MongoDB server. Please check your connection string and network settings.');
    }
    process.exit(1);
  }
}

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running correctly' });
});

// API Routes
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await db.collection('questions').find().toArray();
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    if (error.name === 'MongoNetworkError') {
      res.status(503).json({ error: 'Database is currently unavailable' });
    } else {
      res.status(500).json({ error: 'Error fetching questions' });
    }
  }
});

app.post('/api/questions', async (req, res) => {
  try {
    const question = {
      text: req.body.text,
      approved: false,
      replies: [],
      createdAt: new Date()
    };
    const result = await db.collection('questions').insertOne(question);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error submitting question:', error);
    res.status(500).json({ error: 'Error submitting question' });
  }
});

app.put('/api/questions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('questions').updateOne(
      { _id: new ObjectId(id) },
      { $set: { approved: true } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question approved successfully' });
  } catch (error) {
    console.error('Error approving question:', error);
    res.status(500).json({ error: 'Error approving question' });
  }
});

app.post('/api/questions/:id/replies', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const result = await db.collection('questions').updateOne(
      { _id: new ObjectId(id) },
      { $push: { replies: { text, createdAt: new Date() } } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.status(201).json({ message: 'Reply added successfully' });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Error adding reply' });
  }
});

app.delete('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('questions').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Error deleting question' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
async function startServer() {
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});