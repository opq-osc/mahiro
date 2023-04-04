from pydantic import BaseModel
from enum import Enum
from .send import Sender


class AtUin(BaseModel):
    QQUid: int
    QQNick: str = ""


class Msg(BaseModel):
    SubMsgType: int
    Content: str = ""
    AtUinLists: list[AtUin] = []
    # TODO: types
    Images: list = []
    Video: dict = {}
    Voice: dict = {}


class SubMsgType:
    mixed = 0
    xml = 12
    video = 19
    json = 51


# group msg
class GroupMessage(BaseModel):
    userId: int
    userNickname: str = ""
    groupId: int
    groupNickname: str = ""
    msg: Msg


class GroupMessageExtra:
    is_text: bool

    def __init__(self, is_text: bool):
        self.is_text = is_text


class GroupMessageMahiro:
    ctx: GroupMessage
    sender: Sender
    extra: GroupMessageExtra

    def __init__(self, ctx: GroupMessage, sender: Sender, extra: GroupMessageExtra):
        self.ctx = ctx
        self.sender = sender
        self.extra = extra


# friend msg
class FriendMessage(BaseModel):
    userId: int
    userNickname: str = ""
    msg: Msg


class FriendMessageMahiro:
    ctx: FriendMessage
    sender: Sender
