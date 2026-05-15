import asyncio
import json
import threading

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..models import ChatRequest

router = APIRouter()


@router.post("/chat")
async def chat(request: ChatRequest):
    async def event_stream():
        queue: asyncio.Queue = asyncio.Queue()
        loop = asyncio.get_event_loop()

        def on_update(event: dict):
            loop.call_soon_threadsafe(queue.put_nowait, event)

        def run():
            try:
                from providers import get_provider
                from agents import ManagerAgent

                pc = request.provider_config
                manager = ManagerAgent(
                    provider=get_provider(pc.manager),
                    planner_provider=get_provider(pc.planner),
                    researcher_provider=get_provider(pc.researcher),
                    coder_provider=get_provider(pc.coder),
                    reviewer_provider=get_provider(pc.reviewer),
                )

                full_query = request.query
                if request.files:
                    file_sections = "\n\n".join(
                        f"### {f.name}\n```\n{f.content}\n```"
                        for f in request.files
                    )
                    full_query = f"{full_query}\n\n---\nAttached files:\n{file_sections}"

                result = manager.orchestrate(full_query, on_update=on_update)
                loop.call_soon_threadsafe(
                    queue.put_nowait, {"type": "result", "content": result}
                )
            except Exception as e:
                loop.call_soon_threadsafe(
                    queue.put_nowait, {"type": "error", "message": str(e)}
                )
            finally:
                loop.call_soon_threadsafe(
                    queue.put_nowait, {"type": "done"}
                )

        thread = threading.Thread(target=run, daemon=True)
        thread.start()

        while True:
            event = await queue.get()
            yield f"data: {json.dumps(event)}\n\n"
            if event["type"] in ("done", "error"):
                break

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
