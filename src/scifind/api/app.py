from fastapi import FastAPI
from scalar_fastapi import add_scalar_reference

from scifind.api.routes.documents import router as documents_router
from scifind.api.routes.search import router as search_router

app = FastAPI()
app.include_router(documents_router)
app.include_router(search_router)
add_scalar_reference(app)
