from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Msg(BaseModel):
    SubMsgType: int
    Content: str = ""
    # TODO: types
    AtUinLists: list = []
    Images: list = []
    Video: dict = {}
    Voice: dict = {}


class Message(BaseModel):
    userId: int
    userNickname: str = ""
    groupId: int
    groupNickname: str = ""
    msg: Msg


@app.post("/recive/group")
async def recive(data: Message):
    # todo
    return data


class FriendMessage(BaseModel):
    userId: int
    userNickname: str = ""
    msg: Msg


@app.post("/recive/friend")
async def recive(data: Message):
    # todo
    return data
