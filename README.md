# Dealership Creative Automation Tool

A full-stack web application that automates the generation of social media creatives for automotive dealerships. Select a brand account, choose one or more dealerships, upload a background image, and the system composites each dealership's panel and logo onto the background using intelligent auto-positioning — outputting ready-to-post Instagram images.

---

## Features

- **Multi-brand account management** — Tata, Kia, and Volkswagen accounts pre-seeded
- **Bulk creative generation** — select multiple dealerships and generate all creatives in one click, packaged into a ZIP download
- **Asset library** — upload and reuse panels, logos, and background images across jobs
- **Smart image composition** — Pillow-powered engine with four intelligent automations (see below)
- **Three output formats** — Instagram Square, Portrait, and Story
- **JWT authentication** — secure login with token-based sessions

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Python · FastAPI · SQLAlchemy · Pillow  |
| Frontend | React · Vite · Axios                    |
| Database | PostgreSQL                              |
| Auth     | JWT (python-jose) · bcrypt (passlib)    |

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 1. Database

Create the database and load the schema with seed data:

```bash
psql -U postgres -c "CREATE DATABASE dealership_db;"
psql -U postgres -d dealership_db -f database.sql
```

On Windows (PowerShell):

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE dealership_db;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d dealership_db -f "database.sql"
```

The seed data creates the admin user and three brand accounts (Tata, Kia, Volkswagen) with sample dealerships.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/dealership_db
SECRET_KEY=replace-with-a-long-random-string
```

Start the API server:

```bash
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

---

## Default Admin Login

| Field    | Value                |
|----------|----------------------|
| Email    | admin@dealership.com |
| Password | admin123             |

---

## How to Use

1. Log in with the admin credentials above
2. On the dashboard, select a **brand account** (Tata, Kia, or Volkswagen)
3. Choose one or more **dealerships** — selecting multiple enables bulk generation
4. Upload a **background image** or pick one from the asset library
5. Choose an **output format** (Square / Portrait / Story)
6. Click **Generate** — a ZIP file downloads automatically with one creative per dealership

Sample panels, logos, and background images are provided in the `assets (1)/` folder.

---

## Project Structure

```
Assignment/
├── backend/
│   ├── app/
│   │   ├── models/          SQLAlchemy ORM models
│   │   ├── routers/         FastAPI route handlers
│   │   ├── schemas/         Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── composer.py  Image composition engine (Pillow)
│   │   │   └── zip_builder.py
│   │   ├── auth.py          JWT authentication
│   │   ├── database.py      DB session factory
│   │   └── main.py          FastAPI app entry point
│   ├── .env.example         Environment variable template
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/             Axios API client modules
│       ├── pages/           React page components
│       └── store/           Auth context
├── assets (1)/              Sample panels, logos, and background images
├── database.sql             Full schema + seed data
└── README.md
```

---

## Output Formats

| Format             | Size      |
|--------------------|-----------|
| Instagram Square   | 1080×1080 |
| Instagram Portrait | 1080×1350 |
| Instagram Story    | 1080×1920 |

---

## Smart Automation

The composition engine (`backend/app/services/composer.py`) implements four intelligent automations:

**Smart background scaling** — The background is resized to cover the canvas exactly using a cover-crop algorithm. No white space, no distortion, no manual sizing needed.

**Auto panel placement** — The dealership panel is scaled to 80% of the canvas width (capped at 40% of the height to preserve aspect ratio) and anchored to the lower third of the frame — consistent across all three output formats.

**Pixel-variance logo placement** — The canvas is divided into four corners. The luminance variance of each corner region is sampled from the background image. The logo is placed in the calmest (lowest variance) corner that does not overlap the panel — ensuring the logo is always readable against a visually clean area, regardless of the background used.

**Resolution-independent sizing** — All positioning values (panel size, logo size, padding, placement ratios) are calculated as percentages of the canvas dimensions. The same logic produces correct results for all three output formats without any manual adjustment per format.

---

## API Reference

Full interactive docs available at http://localhost:8000/docs after starting the backend.

| Method | Endpoint                    | Description                        |
|--------|-----------------------------|------------------------------------|
| POST   | /auth/register              | Register a new user                |
| POST   | /auth/login                 | Login and receive JWT token        |
| GET    | /accounts                   | List brand accounts                |
| GET    | /accounts/{id}/dealerships  | List dealerships for an account    |
| POST   | /assets/upload              | Upload a panel, logo, or background|
| GET    | /assets                     | List uploaded assets               |
| DELETE | /assets/{id}                | Delete an asset                    |
| POST   | /jobs                       | Create and run a generation job    |
| GET    | /jobs                       | List all jobs with outputs         |
| GET    | /jobs/{id}/download         | Download ZIP of all creatives      |
