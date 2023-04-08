from fastapi import FastAPI
from .models import GroupMessage, FriendMessage, GroupMessageContainer

# plugins
from plugins.chinchin_pk_mahiro.main import chinchin_pk
from plugins.opqqq_plugins_mahiro.src.bot_good_morning import bot_good_morning

app = FastAPI()

container = GroupMessageContainer()

# load plugins
# TODO: auto import all plugins and dynamic call
container.add(id="牛了个牛", callback=chinchin_pk)
container.add(id="早晚安", callback=bot_good_morning)


@app.post("/recive/group")
async def recive_group(data: GroupMessage):
    await container.call(ctx=data)

    # response
    return {"code": 200}


@app.post("/recive/friend")
async def recive_friend(data: FriendMessage):
    # todo
    return {"code": 200}
