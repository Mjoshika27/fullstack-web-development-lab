# Experiment 5 — Online Survey Application

This project follows the **same simple structure and workflow** as the attached Feedback Form reference: React + Vite frontend, Axios requests, a Node.js + Express backend, and JSON-file storage. MongoDB is not required.

## Folder structure

```text
ex5/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── data/
│   │   └── responses.json
│   ├── questions.json
│   ├── server.js
│   └── package.json
└── README.md
```

## Backend

Open a VS Code terminal:

```powershell
cd C:\Users\JOSHIKA\OneDrive\Desktop\fullstack\ex5\server
npm install
npm start
```

The server runs at `http://localhost:5000`.

## Frontend

Open a second terminal:

```powershell
cd C:\Users\JOSHIKA\OneDrive\Desktop\fullstack\ex5\client
npm install
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

## Functionality

- The server keeps a question bank containing 20 example questions in `server/questions.json`.
- The server randomly chooses five questions for each new survey request.
- The React page displays those five questions and collects the answers.
- Survey responses are saved in `server/data/responses.json`.
- The saved responses are listed below the form and can be edited or deleted, matching the CRUD example in the reference document.
- No MongoDB setup is needed.

## Test the backend

Open `http://localhost:5000/api/health`. You should see a JSON status response.
