from typing import Optional

from fastapi import APIRouter, Query

from models import ContextRequest, ContextState
from services.context import compose_context


router = APIRouter(prefix="/api/context", tags=["context"])


@router.post("", response_model=ContextState)
async def get_context(
    request: ContextRequest,
    demo: Optional[str] = Query(default=None),
):
    return await compose_context(
        lat=request.latitude,
        lng=request.longitude,
        accuracy_meters=request.accuracy_meters,
        demo_mode=demo,
    )
