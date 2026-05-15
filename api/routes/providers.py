from fastapi import APIRouter
from providers import SUPPORTED_PROVIDERS

router = APIRouter()


@router.get("/providers")
def list_providers():
    return {"providers": list(SUPPORTED_PROVIDERS)}
