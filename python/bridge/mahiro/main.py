import os
import uvicorn
from fastapi import FastAPI

from .models import GroupMessage, FriendMessage, MessageContainer, Auth
from .version import __VERSION__

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


@app.post("/recive/auth")
async def recive_auth(data: Auth):
    print("Auth token received")
    g_container.set_token(data.token)
    print("Registering all plugins to node...")
    g_container.register_all_plugins()
    return {"code": 200}


@app.get("/recive/health")
async def recive_health():
    return {"code": 200, "version": __VERSION__}


MAHIRO_PYTHON_PORT = os.getenv("MAHIRO_PYTHON_PORT", 8099)


class Mahiro:
    container: MessageContainer = g_container

    def __init__(self):
        pass

    def run(
        self,
        port: int = MAHIRO_PYTHON_PORT,
        host: str = "0.0.0.0",
        reload: bool = False,
    ):
        print("Mahiro Python Bridge is running on port", port)
        # trigger get token url
        print("Triggering get token...")
        self.container.want_get_token()
        uvicorn.run(app=app, port=port, host=host, reload=reload)
