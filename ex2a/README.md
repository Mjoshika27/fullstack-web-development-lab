# Experiment 2(a) — Spice Garden Restaurant

A responsive food-delivery website based on the Full Stack Web Development Laboratory syllabus and the supplied Spice Garden Restaurant reference screenshot.

## Features

- Restaurant information and category navigation
- Searchable menu with food cards
- Add items to cart, increase/decrease quantity, and remove items
- Automatic subtotal, delivery fee, and order-total calculation
- Checkout form with name, phone, delivery address, payment choice, and optional notes
- Order confirmation screen
- Recent order history in the current browser
- React frontend and Node.js/Express backend
- MongoDB menu and order persistence
- Demo fallback mode: menu browsing and cart remain usable if the backend/database is offline; demo orders are explicitly labelled and saved only in that browser
- Responsive desktop and mobile layout

## Stack

- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- Lucide React icons

## Requirements

- Node.js (LTS or a current supported release)
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## 1. Start MongoDB

On Windows PowerShell, check the service:

```powershell
Get-Service MongoDB
```

If it is installed but stopped, run PowerShell as Administrator and start it:

```powershell
Start-Service MongoDB
```

The default connection used by this project is `mongodb://127.0.0.1:27017/spice_garden`.

## 2. Configure and start the backend

Open a terminal in this folder, then:

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run seed
npm run dev
```

Keep this terminal running. On first successful startup, the server also inserts the sample menu automatically if the menu collection is empty.

Backend runs at `http://localhost:5000`.

Check `http://localhost:5000/api/health`; the response should show `status: "ok"` and `database: "connected"`.

If using MongoDB Atlas instead of local MongoDB, set `MONGO_URI` in `backend/.env` to your Atlas connection string. Do not share that connection string publicly.

## 3. Start the frontend

Open a second terminal in the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL displayed in the terminal, usually `http://localhost:5173`.

Keep the backend and frontend terminals open while using the site. Use Vite, not Live Server, for this React project.

## Notes

- The reference screenshot's restaurant name, menu, cart, delivery form, and order confirmation informed the page structure and visual direction.
- Menu photos are loaded from Unsplash URLs, so an internet connection is needed for those photos. All UI and local demo fallback behaviour still works if image requests fail.
- The checkout choices are for a lab demonstration. The app records the selected payment method; it does not charge cards or process real online payments.
- Demo fallback mode is not a substitute for database persistence. For a full-stack demonstration, start MongoDB and the backend and confirm `/api/health` reports `database: "connected"`.

## Project structure

```text
ex2a-spice-garden/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── data/menu.js
│       ├── models/MenuItem.js
│       ├── models/Order.js
│       ├── routes/menu.js
│       ├── routes/orders.js
│       ├── seed.js
│       └── server.js
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── data/fallbackMenu.js
        ├── main.jsx
        └── styles.css
```
