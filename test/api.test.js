const { test, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../server');

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

function send(method, path, body) {
  return fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test('serves the home page', async () => {
  const res = await fetch(base + '/');
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /Task Tracker/);
});

test('create, list, update and delete a task', async () => {
  let res = await send('POST', '/api/tasks', { title: '  Write tests  ' });
  assert.strictEqual(res.status, 201);
  const task = await res.json();
  assert.strictEqual(task.title, 'Write tests');
  assert.strictEqual(task.done, false);

  res = await send('GET', '/api/tasks');
  const list = await res.json();
  assert.ok(list.some((t) => t.id === task.id));

  res = await send('PATCH', `/api/tasks/${task.id}`, { done: true, title: 'Ship it' });
  assert.strictEqual(res.status, 200);
  const updated = await res.json();
  assert.strictEqual(updated.done, true);
  assert.strictEqual(updated.title, 'Ship it');

  res = await send('DELETE', `/api/tasks/${task.id}`);
  assert.strictEqual(res.status, 204);

  res = await send('DELETE', `/api/tasks/${task.id}`);
  assert.strictEqual(res.status, 404);
});

test('rejects invalid input', async () => {
  assert.strictEqual((await send('POST', '/api/tasks', { title: '   ' })).status, 400);
  assert.strictEqual((await send('POST', '/api/tasks', {})).status, 400);
  assert.strictEqual(
    (await send('POST', '/api/tasks', { title: 'x'.repeat(121) })).status,
    400
  );

  const task = await (await send('POST', '/api/tasks', { title: 'Valid' })).json();
  assert.strictEqual(
    (await send('PATCH', `/api/tasks/${task.id}`, { done: 'yes' })).status,
    400
  );
  assert.strictEqual((await send('PATCH', '/api/tasks/99999', { done: true })).status, 404);
});

test('rejects malformed JSON', async () => {
  const res = await fetch(base + '/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not json',
  });
  assert.strictEqual(res.status, 400);
});
