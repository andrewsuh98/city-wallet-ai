from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from models import ContextRequest, ContextState
from services.context import compose_context


router = APIRouter(prefix="/api/context", tags=["context"])


@router.post("", response_model=ContextState)
async def get_context(
    request: ContextRequest,
    demo: Optional[str] = Query(default=None),
):
    if not (-90.0 <= request.latitude <= 90.0) or not (-180.0 <= request.longitude <= 180.0):
        raise HTTPException(status_code=400, detail="latitude/longitude out of range")
    return await compose_context(
        lat=request.latitude,
        lng=request.longitude,
        accuracy_meters=request.accuracy_meters,
        demo_mode=demo,
    )
