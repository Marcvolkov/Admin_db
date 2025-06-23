from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import init_databases
from .routers import auth, environments, tables, data, approvals

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize databases
    init_databases()
    yield
    # Shutdown: cleanup if needed

app = FastAPI(title="Admin DB API", version="1.0.0", lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(environments.router, prefix="/environments", tags=["Environments"])
app.include_router(tables.router, prefix="/tables", tags=["Tables"])
app.include_router(data.router, prefix="/data", tags=["Data"])
app.include_router(approvals.router, prefix="/approvals", tags=["Approvals"])

@app.get("/")
def root():
    return {"message": "Admin DB API is running"}