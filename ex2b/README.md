# Experiment 2(b) — ReLoop Classifieds Marketplace

A responsive classified web application for browsing, listing, editing, and removing used products. The UI uses a green, cream, and muted gold palette inspired by the supplied marketplace reference image, while making the main syllabus requirement explicit: people can sell their own used products and other people can enquire about them.

## Features

- Browse used-product listings by category.
- Search by title, description, category, location, or seller.
- Filter by maximum price and sort by recommended, newest, or price.
- View product details, condition, price, location, and seller.
- Create a listing with product details and optional public image URL.
- Edit or delete listings whose seller name matches the current demo profile.
- Save and unsave favourites in the browser.
- Send a buyer enquiry to the seller; database mode stores enquiries in MongoDB.
- Responsive desktop, tablet, and mobile layout.
- The frontend can run in browser demo mode when the API is unavailable; demo changes remain in the current browser only and are not sent to MongoDB.

## Technology

- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- Lucide React icons

## Windows / VS Code setup

Extract this project into `C:\Users\JOSHIKA\OneDrive\Desktop\fullstack\ex2b` so that `backend` and `frontend` are directly inside `ex2b`.

### 1. Ensure MongoDB is running

Open PowerShell and run:

```powershell
Get-Service MongoDB
```

The status should be `Running`. If it is stopped, open PowerShell as Administrator and run `Start-Service MongoDB`.

### 2. Start the backend (Terminal 1)

```powershell
cd C:\Users\JOSHIKA\OneDrive\Desktop\fullstack\ex2b\backend
Copy-Item .env.example .env
npm install
npm run seed
npm run dev
```

Run `Copy-Item .env.example .env` only once. If `.env` already exists, skip that command. The default database connection is `mongodb://127.0.0.1:27017/reloop_market`.

Keep this terminal open. The backend should run at `http://localhost:5000`.

Check the health endpoint at `http://localhost:5000/api/health`. A successful response reports `"database":"connected"`.

### 3. Start the frontend (Terminal 2)

```powershell
cd C:\Users\JOSHIKA\OneDrive\Desktop\fullstack\ex2b\frontend
npm install
npm run dev
```

Open the local URL Vite displays, normally `http://localhost:5173`. Keep both terminals running.

## Demo profile

The initial demo seller name is **Kamali**. The seeded sample listings include one listed by Kamali so the “My listings” section can be demonstrated. Click the profile chip in the header to change the demo seller name. A listing appears under “My listings” when its seller name matches the current demo name.

**Classroom project note:** this is a lab demo, not a production marketplace. The seller name is a demo ownership check, not secure authentication. There is no real payment processing. An enquiry records interest and does not guarantee a purchase; meet safely and agree on payment with the seller.

## Troubleshooting

- **`ECONNREFUSED 127.0.0.1:27017`**: MongoDB Server is not running. Start the MongoDB Windows service, then run `npm run seed` again.
- **`Failed to fetch` in the browser**: check that the backend terminal is running, MongoDB reports connected, and the frontend is opened using the Vite URL (not Live Server).
- **Port 5000 is in use**: stop the other backend process before starting this one.
- **Demo mode banner**: the interface is still usable, but CRUD and enquiries are stored in this browser only until MongoDB and the backend are running.
