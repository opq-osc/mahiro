from fastapi import FastAPI
from .send import Sender
from .models import (
    GroupMessage,
    FriendMessage,
    SubMsgType,
    GroupMessageMahiro,
    GroupMessageExtra,
)

# plugins
from plugins.chinchin_pk_mahiro.main import chinchin_pk

app = FastAPI()


@app.post("/recive/group")
async def recive_group(data: GroupMessage):
    is_text = data.msg.SubMsgType == SubMsgType.mixed
    extra = GroupMessageExtra(is_text=is_text)
    mahiro = GroupMessageMahiro(ctx=data, sender=Sender(), extra=extra)

    # call plugins
    # TODO: auto import all plugins and dynamic call
    await chinchin_pk(mahiro)

    # response
    return {"code": 200}


@app.post("/recive/friend")
async def recive_friend(data: FriendMessage):
    # todo
    return {"code": 200}
