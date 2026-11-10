# PKollector

<p align="right">
  <img alt="English (current language)" src="https://img.shields.io/badge/English-3b4cca?style=for-the-badge" />
  <a href="README.es.md">
    <img alt="Español" src="https://img.shields.io/badge/Español-e5e7eb?style=for-the-badge&labelColor=e5e7eb&color=374151" />
  </a>
</p>

<p align="center">
  <img src="./frontend/src/assets/logo_pkollector.png" alt="PKollector logo" width="600" />
</p>

<p align="center">
  <strong>Your Pokémon TCG collection, organized and always at hand.</strong><br />
  A tool made by a collector, for collectors.
</p>

<p align="center">
  <a href="https://p-kollector.vercel.app/"><strong>🎴 Visit PKollector</strong></a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
</p>

## 👋 Why I built PKollector

I collect Pokémon cards and wanted a simple way to keep track of them. With
cards from so many sets and plenty of duplicates, it can be hard to remember
what I own and what I'm still looking for. I built PKollector to keep it all in
one place.

The idea is simple: check your collection, record how many copies you have, and
see which cards are still missing. That makes it easier to stay organized and
enjoy the hobby. I hope you find it useful too.

## ✨ What can you do with PKollector?

- **Search and sort cards:** find cards by name and organize results by name,
  release date, HP, or card number.
- **Narrow down your search:** filter by series, set, energy type, category,
  subtype, rarity, HP range, or collection status.
- **Check card details:** view attacks and energy costs, abilities, weaknesses,
  resistances, rarity, and artist.
- **Keep an accurate count:** record how many copies you own and see which
  cards you have or are missing right in the catalog.
- **Keep track of what you're looking for:** add cards to your wishlist.
- **See what you could trade:** find duplicate cards and check how many extra
  copies you have.
- **Work through sets one at a time:** browse and sort sets, preview featured
  cards, and see how much of each set you've completed.
- **See your progress at a glance:** track collected and missing cards across
  your whole collection and within each set.
- **Get started without a fuss:** use PKollector as a guest and create an
  account whenever you're ready; your guest collection transfers to your
  account when you register.

## 🌐 Try it online

The app is live. Come take a look:

### 👉 [p-kollector.vercel.app](https://p-kollector.vercel.app/)

Explore the catalog and start organizing your collection. You can also create
an account to keep your collection linked to your profile.

## ☁️ Where is it deployed?

The live app has three parts:

| Part | Service | What it does |
| --- | --- | --- |
| Web app | [Vercel](https://vercel.com/) | Hosts the React frontend |
| API | [Render](https://render.com/) | Runs the FastAPI backend |
| Database | [Neon](https://neon.tech/) | Hosts PostgreSQL |

The frontend talks to the API, which stores data in PostgreSQL. To deploy your
own instance, configure the production environment variables for each service:
set `VITE_API_URL` in Vercel to the public API URL, `DATABASE_URL` in Render to
your Neon database, and `CORS_ORIGINS` in Render to include your deployed
frontend domain. Never commit production credentials to the repository.

## 🧰 Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, JavaScript |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Card data | [Pokémon TCG API](https://docs.pokemontcg.io/) (deprecated) |

## 🗂️ Project structure

```text
.
├── backend/
│   ├── app/                 # API, models, and database access
│   ├── scripts/             # Schema creation and data import
│   └── requirements.txt
├── frontend/
│   ├── src/                 # React application
│   └── package.json
└── docker-compose.yml       # PostgreSQL service for local development
```

## 🚀 Run it locally

You'll need:

- Python 3.10 or later.
- Node.js and npm.
- Docker and Docker Compose, or your own PostgreSQL instance.
- A Pokémon TCG API key is optional, but may help when importing data.

### 1. Start the database

From the project root:

```bash
docker compose up -d db
```

[`docker-compose.yml`](./docker-compose.yml) starts PostgreSQL on port `5433`
and creates the `pkollector` database. The included credentials are for local
development only; don't use them in a public or production environment.

### 2. Set up the backend

Create a virtual environment and install the server dependencies:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows, activate the virtual environment with:

```powershell
.venv\Scripts\Activate.ps1
```

Create `backend/.env` with your PostgreSQL connection URL. The external API key
is optional:

```dotenv
DATABASE_URL=postgresql+psycopg://pkollector:pkollector@localhost:5433/pkollector
POKEMONTCG_API_KEY=
CORS_ORIGINS=http://localhost:5173
```

`DATABASE_URL` is required to connect the backend to PostgreSQL.
`POKEMONTCG_API_KEY` is used when importing data from the Pokémon TCG API.
`CORS_ORIGINS` controls which origins may access the API; if omitted, the
backend allows `http://localhost:5173`.

Create the tables and import the card catalog:

```bash
python -m scripts.create_tables
python -m scripts.ingest
```

A full import may take a while and depends on the external API's availability
and rate limits. To import only a range of pages, provide the first and last
page:

```bash
python -m scripts.ingest 1 5
```

Optionally, generate the featured cards shown in set views:

```bash
python -m scripts.compute_showcase
```

Start the API from the `backend` directory:

```bash
uvicorn app.main:app --reload
```

That's it! The API is available at <http://localhost:8000>. You can also try
its endpoints in FastAPI's interactive documentation at
<http://localhost:8000/docs>.

> **Warning:** `python -m scripts.create_tables reset` drops the existing
> tables before recreating them. This deletes the stored data.

### 3. Start the web app

In another terminal, from the project root:

```bash
cd frontend
npm install
npm run dev
```

Vite prints the local address in the terminal (usually
<http://localhost:5173>). By default, the frontend uses
`http://localhost:8000` as its API URL. To change it, create `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:8000
```

## 🧩 Database

The catalog, card details, and collection data are stored separately to make
the relationships easier to follow. Each card belongs to a set; its attacks
and abilities live in their own tables, while the collection and wishlist
record what each user owns or is looking for.

The `collection` and `wishlist` tables prevent the same card from being
recorded more than once for the same user.

```mermaid
erDiagram
    SETS {
        string id PK
        string name
        string series
        date release_date
        string image_logo
    }

    CARDS {
        string id PK
        string set_id FK
        string name
        string supertype
        string hp
        string rarity
        string number
    }

    CARD_ABILITIES {
        int id PK
        string card_id FK
        int position
        string name
        text text
        string type
    }

    CARD_ATTACKS {
        int id PK
        string card_id FK
        int position
        string name
        string cost
        string damage
    }

    CARD_WEAKNESSES {
        int id PK
        string card_id FK
        int position
        string type
        string value
    }

    CARD_RESISTANCES {
        int id PK
        string card_id FK
        int position
        string type
        string value
    }

    USERS {
        string id PK
        string username UK
        string password_hash
        datetime created_at
    }

    COLLECTION {
        int id PK
        string user_id
        string card_id FK
        int quantity
    }

    WISHLIST {
        int id PK
        string user_id
        string card_id FK
    }

    SET_SHOWCASE {
        int id PK
        string set_id FK
        string card_id FK
        int position
    }

    SETS ||--o{ CARDS : contains
    CARDS ||--o{ CARD_ABILITIES : has
    CARDS ||--o{ CARD_ATTACKS : has
    CARDS ||--o{ CARD_WEAKNESSES : has
    CARDS ||--o{ CARD_RESISTANCES : has
    CARDS ||--o{ COLLECTION : tracked_in
    CARDS ||--o{ WISHLIST : requested_in
    SETS ||--o{ SET_SHOWCASE : features
    CARDS ||--o{ SET_SHOWCASE : featured_as
    USERS ||..o{ COLLECTION : identified_by
    USERS ||..o{ WISHLIST : identified_by
```

The dotted lines show how users are associated with their collection and
wishlist. In the database, `collection.user_id` and `wishlist.user_id` store a
user ID, but they are not foreign keys referencing `users.id`. Cards and
showcase entries, on the other hand, are linked to their respective tables
through foreign keys.

## 🔌 API

Here are some of the main routes:

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Check whether the API is responding |
| `GET` | `/filters` | Get available catalog filter options |
| `GET` | `/sets` | List sets and preview cards |
| `GET` | `/sets/{set_id}` | Get set details |
| `GET` | `/cards` | Search, filter, and paginate cards |
| `GET` | `/cards/{card_id}` | Get all details for a card |
| `GET` / `PUT` | `/collection` and `/collection/{card_id}` | Read or update the collection |
| `GET` / `PUT` | `/wishlist` and `/wishlist/{card_id}` | Read or update the wishlist |
| `GET` | `/progress` | Get collection progress by set |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Sign in |

Collection and wishlist routes use the `X-User-Id` header. The frontend handles
it automatically, so you don't need to configure it yourself.

## ✅ Development checks

When working on the frontend, run these checks from `frontend/`:

```bash
npm run lint
npm run build
```

## 📦 Data and attribution

Catalog data was imported from the [Pokémon TCG API](https://docs.pokemontcg.io/),
which is now deprecated. Set and card records, including image URLs and market
price data, were obtained through that API; the availability and accuracy of
upstream data depend on the service. Pokémon names, images, and trademarks
belong to their respective owners.

## 🔭 What I'd like to build next

I'd like PKollector to become a better companion for a real-world collection,
not just a way to count cards. These are some directions I'd like to explore
over time, guided by what turns out to be most useful.

### 🧭 Keeping the catalog alive

The next major step is moving away from the [Pokémon TCG API](https://docs.pokemontcg.io/),
the deprecated source used to import the current catalog. Existing API keys are
expected to remain active until **March 1, 2027**. The collection already in
the database should remain available, but adding new sets and refreshing
upstream data will require a replacement — perhaps Scrydex or TCGdex — and a
long-term plan for serving images. I'd also like to make the price data already
being stored more useful and automate catalog and featured-card updates, so
they don't depend on running scripts by hand.

### 🗃️ Capturing more about each card

For now, the collection only records how many copies of each card you own.
Eventually, I'd like to track each card's variant — such as holo or reverse —
language, and condition too. That would make collection entries more precise
and help produce more meaningful value estimates. CSV import and export would
also make it easier to back up a collection or move it between tools.

Another way to explore a collection would be by Pokémon — for example, seeing
every Pikachu card across sets — or by viewing a set as the 3 × 3 pages of a
physical binder. A shareable profile could make it easier to show off a
collection or the cards available for trade. I'd also like to support Spanish
card names, depending on what the future data source can provide.

### 📈 Making collection data more useful

With prices tracked over time, PKollector could show how the value of a card or
an entire collection changes, instead of only showing a snapshot of today's
price. That could lead to collection statistics by type, rarity, or era;
progress by series; and a way to estimate which set is closest to completion
and what it might cost. Price alerts for wishlist cards would be useful, too.

## 📄 License

There is currently no license file in this repository. Until one is added, do
not assume the code can be reused or redistributed without permission.

## ⚠️ Disclaimer

PKollector is a non-profit fan project and is not affiliated with, sponsored by,
or endorsed by Nintendo, Creatures, GAME FREAK, or The Pokémon Company.
