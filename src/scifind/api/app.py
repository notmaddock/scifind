import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scalar_fastapi import add_scalar_reference

from scifind.api.routes.documents import router as documents_router
from scifind.api.routes.search import router as search_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.environ.get(
            "SCIFIND_FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ],
    allow_methods=["GET", "POST", "DELETE"],
)
app.include_router(documents_router)
app.include_router(search_router)
add_scalar_reference(app)
