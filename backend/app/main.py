from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from pathlib import Path
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "ok",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


# Include routers
from app.api.v1 import auth, config, events, geocode, widget, widgets, api_keys, embed, stats

app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/v1/auth", tags=["auth"])
app.include_router(config.router, prefix=f"{settings.API_PREFIX}/v1/config", tags=["config (public)"])
app.include_router(events.router, prefix=f"{settings.API_PREFIX}/v1/events", tags=["events"])
app.include_router(geocode.router, prefix=f"{settings.API_PREFIX}/v1/geocode", tags=["geocode"])
app.include_router(widget.router, prefix=f"{settings.API_PREFIX}/v1/widget", tags=["widget (public)"])
app.include_router(widgets.router, prefix=f"{settings.API_PREFIX}/v1/widgets", tags=["widgets (admin)"])
app.include_router(api_keys.router, prefix=f"{settings.API_PREFIX}/v1/api-keys", tags=["api-keys"])
app.include_router(embed.router, prefix=f"{settings.API_PREFIX}/v1/embed", tags=["embed"])
app.include_router(stats.router, prefix=f"{settings.API_PREFIX}/v1/stats", tags=["stats"])


# Serve widget JavaScript file
@app.get("/api/v1/widget.js")
async def get_widget_script():
    """Serve the widget JavaScript file."""
    widget_path = Path("/app/widget/dist/widget.umd.cjs")
    return FileResponse(
        widget_path,
        media_type="application/javascript; charset=utf-8",
        headers={
            "Cache-Control": "public, max-age=3600",
        },
    )


# Serve widget source map
@app.get("/api/v1/widget.umd.cjs.map")
async def get_widget_sourcemap():
    """Serve the widget source map file."""
    sourcemap_path = Path("/app/widget/dist/widget.umd.cjs.map")
    if not sourcemap_path.exists():
        return {"error": "Source map not found"}
    return FileResponse(
        sourcemap_path,
        media_type="application/json; charset=utf-8",
        headers={
            "Cache-Control": "public, max-age=3600",
        },
    )
