# Task Tracker

A small task tracker built with Node.js and Express. Add tasks, edit them, mark them complete, delete them, and filter by status.

**Live demo:** _add your deployed URL here_

## Features

- Add, edit, complete and delete tasks
- Filter by All / Active / Completed, with a running count of remaining tasks
- REST API with input validation and clear error messages
- Automated API tests using Node's built-in test runner

## Tech stack

- **Back end:** Node.js, Express
- **Front end:** plain HTML, CSS and JavaScript (no framework or build step)
- **Storage:** in memory, so tasks reset when the server restarts

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm start
```

Then open http://localhost:3000.

## Run the tests

```bash
npm test
```

## API

| Method | Route            | Body                              | Result                    |
| ------ | ---------------- | --------------------------------- | ------------------------- |
| GET    | `/api/tasks`     | –                                 | `200` list of tasks       |
| POST   | `/api/tasks`     | `{ "title": "Buy milk" }`         | `201` the created task    |
| PATCH  | `/api/tasks/:id` | `{ "title": "...", "done": true }` (either or both) | `200` the updated task |
| DELETE | `/api/tasks/:id` | –                                 | `204` no content          |

Invalid input returns `400` and an unknown id returns `404`, each with `{ "error": "..." }`.

## Project structure

```
server.js          Express app and API routes
public/index.html  Page markup
public/style.css   Styles
public/app.js      Front-end logic (fetch calls and rendering)
test/api.test.js   API tests
```

## Design decisions

- **In-memory storage** keeps the app simple to run and deploy. All data access lives in `server.js`, so moving to a database would not touch the front end.
- **No front-end framework**: the UI is small enough that plain JavaScript is easier to read and has nothing to build.
- **Task titles are rendered with `textContent`**, so user input cannot inject HTML into the page.

## Possible next steps

- Persist tasks in a database (SQLite or PostgreSQL)
- User accounts so each person has their own list
- Due dates and priorities

## How AI was used

This app was built with the help of an AI assistant (Claude), which generated the initial code from my specification. I reviewed the code, ran the tests, and tested the app manually before publishing.
