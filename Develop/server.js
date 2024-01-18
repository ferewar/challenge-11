const express = require('express');
const path = require('path');
const fsPromises = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 

// Read and write data functions
const readData = async () => {
    try {
        const data = await fsPromises.readFile(path.join(__dirname, '/db/db.json'), 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading file', err);
        return [];
    }
};

const writeData = async (data) => {
    try {
        await fsPromises.writeFile(path.join(__dirname, '/db/db.json'), JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing file', err);
        throw err;
    }
};

// API Routes
app.get('/notes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'notes.html'));
});

app.get('/api/notes', async (req, res) => {
    try {
        const notes = await readData();
        res.json(notes);
    } catch (err) {
        console.error('Failed to get notes', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/notes', async (req, res) => {
    try {
        const notes = await readData();
        console.log('Current notes:', notes);
        if (!req.body.title || !req.body.text) {
            return res.status(400).json({ message: 'Note title and text are required' });
        }
        const newNote = { title: req.body.title, text: req.body.text, id: Math.random().toString(36).substr(2, 9) };
        console.log('New note to add:', newNote);
        notes.push(newNote);
        console.log('Notes after adding new one:', notes);
        await writeData(notes);
        res.json(newNote);
    } catch (err) {
        console.error('Error in POST /api/notes', err);
        res.status(500).json({ error: 'Error adding note' });
    }
});

app.delete('/api/notes/:id', async (req, res) => {
    try {
        const notes = await readData();
        const filteredNotes = notes.filter(note => note.id !== req.params.id);
        await writeData(filteredNotes);
        res.json({ message: 'Note deleted' });
    } catch (err) {
        console.error('Error in DELETE /api/notes/:id', err);
        res.status(500).json({ error: 'Error deleting note' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Server Error');
});
