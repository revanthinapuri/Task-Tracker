// Front end for Task Tracker: talks to the /api/tasks REST API with fetch.

const listEl = document.getElementById('task-list');
const formEl = document.getElementById('add-form');
const inputEl = document.getElementById('new-title');
const errorEl = document.getElementById('error');
const emptyEl = document.getElementById('empty');
const summaryEl = document.getElementById('summary');
const filterButtons = document.querySelectorAll('.filters button');

let tasks = [];
let filter = 'all';      // 'all' | 'active' | 'done'
let editingId = null;    // id of the task being edited, if any

// Small wrapper so every request handles errors the same way.
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

async function run(action) {
  try {
    showError('');
    await action();
  } catch (err) {
    showError(err.message);
  }
  render();
}

function render() {
  const visible = tasks.filter((t) =>
    filter === 'active' ? !t.done : filter === 'done' ? t.done : true
  );

  listEl.replaceChildren(...visible.map(renderTask));

  const remaining = tasks.filter((t) => !t.done).length;
  summaryEl.textContent = tasks.length
    ? `${remaining} of ${tasks.length} remaining`
    : 'Nothing here yet';

  emptyEl.hidden = visible.length > 0;
  emptyEl.textContent = tasks.length
    ? 'No tasks match this filter.'
    : 'Add your first task above.';

  const editInput = listEl.querySelector('input.edit');
  if (editInput) editInput.focus();
}

function renderTask(task) {
  const li = document.createElement('li');
  if (task.done) li.classList.add('done');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.setAttribute('aria-label', `Mark "${task.title}" as done`);
  checkbox.addEventListener('change', () =>
    run(async () => {
      const updated = await api(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ done: checkbox.checked }),
      });
      Object.assign(task, updated);
    })
  );
  li.append(checkbox);

  if (editingId === task.id) {
    const edit = document.createElement('input');
    edit.type = 'text';
    edit.className = 'edit';
    edit.maxLength = 120;
    edit.value = task.title;

    const save = () =>
      run(async () => {
        editingId = null;
        const title = edit.value.trim();
        if (!title || title === task.title) return;
        const updated = await api(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ title }),
        });
        Object.assign(task, updated);
      });

    edit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') { editingId = null; render(); }
    });
    edit.addEventListener('blur', () => { if (editingId === task.id) save(); });
    li.append(edit);
  } else {
    // textContent (not innerHTML) so task titles can never inject HTML.
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = task.title;
    li.append(title);

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => { editingId = task.id; render(); });
    li.append(editBtn);
  }

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete';
  del.textContent = 'Delete';
  del.addEventListener('click', () =>
    run(async () => {
      await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
      tasks = tasks.filter((t) => t.id !== task.id);
    })
  );
  li.append(del);

  return li;
}

formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = inputEl.value.trim();
  if (!title) return showError('Please enter a task.');
  run(async () => {
    const task = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    tasks.push(task);
    inputEl.value = '';
  });
});

filterButtons.forEach((btn) =>
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
    render();
  })
);

// Initial load
run(async () => { tasks = await api('/api/tasks'); });
