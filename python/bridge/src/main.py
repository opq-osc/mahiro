from fastapi import FastAPI
from .models import GroupMessage, FriendMessage, MessageContainer

app = FastAPI()

container = MessageContainer()


@app.post("/recive/group")
async def recive_group(data: GroupMessage):
    await container.call_group(ctx=data)

    return {"code": 200}


@app.post("/recive/friend")
async def recive_friend(data: FriendMessage):
    await container.call_friend(ctx=data)

    return {"code": 200}
