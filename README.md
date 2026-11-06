# Task Manager API

A full-stack task management application built with the MERN stack. Users can register, log in and manage their own tasks securely.

## Features

- User registration and login with JWT authentication
- Password hashing with bcrypt
- Create, edit, complete and delete tasks
- Priority levels, due dates, search and status filter
- Each user can access only their own tasks

## Tech Stack

- Frontend: React (Vite), Axios
- Backend: Node.js, Express.js
- Database: MongoDB Atlas, Mongoose
- Authentication: JSON Web Token, bcryptjs

## API Endpoints

- POST /api/auth/register : register a new user
- POST /api/auth/login : log in and receive a token
- GET /api/auth/me : get the logged-in user
- GET /api/tasks : get all tasks of the user
- POST /api/tasks : create a task
- PUT /api/tasks/:id : update a task
- DELETE /api/tasks/:id : delete a task

## How to Run

1. Clone the repository:

```
git clone https://github.com/rakshitharakshitha22759-wq/task-manager-api.git
```

2. Start the backend:

```
cd backend
npm install
node server.js
```

Create a `.env` file inside the `backend` folder with these values:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=3000
```

3. Start the frontend in a second terminal:

```
cd backend/frontend
npm install
npm run dev
```

4. Open http://localhost:5173 in the browser.

## Author

Rakshitha
