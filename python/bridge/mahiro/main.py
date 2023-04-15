from fastapi import FastAPI
from .models import GroupMessage, FriendMessage, MessageContainer
import uvicorn
import os

app = FastAPI()

g_container = MessageContainer()

@app.post("/recive/group")
async def recive_group(data: GroupMessage):
    await g_container.call_group(ctx=data)

    return {"code": 200}


@app.post("/recive/friend")
async def recive_friend(data: FriendMessage):
    await g_container.call_friend(ctx=data)

    return {"code": 200}


MAHIRO_PYTHON_PORT = os.getenv("MAHIRO_PYTHON_PORT", 8099)

class Mahiro:

    container = g_container

    def __init__(self):
        pass

    def run(
        self,
        port: int = MAHIRO_PYTHON_PORT,
        host: str = "0.0.0.0",
        reload: bool = False,
    ):
        print("Mahiro Python Bridge is running on port", port)
        print('Registering all plugins...')
        self.container.register_all_plugins()
        uvicorn.run(app=app, port=port, host=host, reload=reload)
