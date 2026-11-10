const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage: data resets whenever the server restarts.
// Swapping this for a database would only change the code in this file.
let nextId = 1;
const tasks = [];

const MAX_TITLE_LENGTH = 120;

// Returns a cleaned title, or null if the input is not a usable title.
function cleanTitle(value) {
  if (typeof value !== 'string') return null;
  const title = value.trim();
  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) return null;
  return title;
}

function findTask(req, res) {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) res.status(404).json({ error: 'Task not found' });
  return task;
}

// List all tasks
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// Create a task
app.post('/api/tasks', (req, res) => {
  const title = cleanTitle(req.body.title);
  if (!title) {
    return res
      .status(400)
      .json({ error: `Title is required (max ${MAX_TITLE_LENGTH} characters)` });
  }
  const task = {
    id: nextId++,
    title,
    done: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  res.status(201).json(task);
});

// Update a task's title and/or done status
app.patch('/api/tasks/:id', (req, res) => {
  const task = findTask(req, res);
  if (!task) return;

  const { title, done } = req.body;

  if (title !== undefined) {
    const cleaned = cleanTitle(title);
    if (!cleaned) {
      return res
        .status(400)
        .json({ error: `Title must be 1-${MAX_TITLE_LENGTH} characters` });
    }
    task.title = cleaned;
  }

  if (done !== undefined) {
    if (typeof done !== 'boolean') {
      return res.status(400).json({ error: 'done must be true or false' });
    }
    task.done = done;
  }

  res.json(task);
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const task = findTask(req, res);
  if (!task) return;
  tasks.splice(tasks.indexOf(task), 1);
  res.status(204).end();
});

// Malformed JSON bodies and unexpected errors
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

// Hosting platforms set PORT; 3000 is the local default.
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Task Tracker running at http://localhost:${PORT}`);
  });
}

module.exports = app;
