# Event Map Widget

B2B SaaS embeddable event map widget service. Event organizers can create events, configure widgets, and get embed code for their websites.

## Tech Stack

- **Backend**: FastAPI (Python 3.11)
- **Frontend (Admin)**: React + TypeScript + Vite
- **Widget**: Vanilla JavaScript (Shadow DOM)
- **Maps**: Yandex Maps API
- **Database**: PostgreSQL + Redis
- **Hosting**: Docker + VPS

## Project Structure

```
event_map_widget/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Config, security
│   │   ├── db/          # Database session
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── services/    # Business logic
│   ├── tests/
│   └── requirements.txt
├── admin-frontend/       # React admin dashboard
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── contexts/
│       └── services/
├── widget/              # Embeddable widget
│   └── src/
│       ├── core/        # Widget core
│       ├── map/         # Map integration
│       ├── filters/     # Filter components
│       └── styles/
├── docs/               # Documentation
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development without Docker)
- Python 3.11+ (for local development without Docker)

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd event_map_widget
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` and set your `YANDEX_MAPS_API_KEY` and `SECRET_KEY`

4. Start all services:
```bash
docker-compose up -d
```

5. Services will be available at:
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- Admin Dashboard: http://localhost:5173

### Local Development

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Admin Frontend

```bash
cd admin-frontend
npm install
npm run dev
```

#### Widget

```bash
cd widget
npm install
npm run build
```

## Development

### Running Tests

Backend:
```bash
cd backend
pytest
```

### Code Linting

Backend:
```bash
cd backend
black app/
flake8 app/
```

Frontend:
```bash
cd admin-frontend
npm run lint
```

## API Documentation

Once running, visit http://localhost:8000/api/docs for interactive API documentation.

## License

MIT
