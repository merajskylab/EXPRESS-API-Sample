import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors'; // Import the CORS middleware
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB (replace 'your-production-mongodb-uri' with your actual URI)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const noteSchema = new mongoose.Schema({
  id: Number,
  title: String,
  content: String,
});

noteSchema.pre('save', async function (next) {
  if (!this.id) {
    const lastNote = await Note.findOne({}, {}, { sort: { id: -1 } });
    this.id = lastNote ? lastNote.id + 1 : 0;
  }
  next();
});

const Note = mongoose.model('Note', noteSchema);

app.use(bodyParser.json());
app.use(helmet());

// Use CORS middleware to enable Cross-Origin Resource Sharing
app.use(cors());

app.use(compression());

app.post('/api/notes', async (req, res) => {
  try {
    const { title, content } = req.body;
    const newNote = new Note({ title, content });
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/notes/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ id: req.params.id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const updatedNote = await Note.findOneAndUpdate({ id: req.params.id }, { title, content }, { new: true });
    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(updatedNote);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const deletedNote = await Note.findOneAndRemove({ id: req.params.id });
    if (!deletedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(deletedNote);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
 