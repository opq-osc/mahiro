from pydantic import BaseModel
from .send import Sender, AtUin, Image
import requests
from typing import Awaitable


class Msg(BaseModel):
    SubMsgType: int
    Content: str = ""
    AtUinLists: list[AtUin] = []
    Images: list[Image] = []
    # todo: add types
    Video: dict = {}
    Voice: dict = {}


class SubMsgType:
    mixed = 0
    xml = 12
    video = 19
    json = 51


# group msg
class GroupMessageConfigs(BaseModel):
    availablePlugins: list[str] = []


class GroupMessage(BaseModel):
    userId: int
    userNickname: str = ""
    groupId: int
    groupNickname: str = ""
    msg: Msg
    configs: GroupMessageConfigs


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

    @staticmethod
    def create_group_message_mahiro(id: str, ctx: GroupMessage):
        is_text = ctx.msg.SubMsgType == SubMsgType.mixed
        extra = GroupMessageExtra(is_text=is_text)
        sender = Sender(id=id)
        return GroupMessageMahiro(ctx=ctx, sender=sender, extra=extra)


class GroupMessageContainer:
    instances: dict[str, Awaitable] = {}

    def __init__(self):
        pass

    def register_plugin_to_node(self, id: str):
        try:
            requests.post(
                Sender.REGISTER_PLUGIN_URL,
                json={"name": id},
            )
            print(f"register plugin [{id}] to node success")
        except Exception as e:
            print("register plugin to node error: ", e)

    def add(self, id: str, callback: Awaitable):
        self.register_plugin_to_node(id=id)
        self.instances[id] = callback

    async def call(self, ctx: GroupMessage):
        available_plugins = ctx.configs.availablePlugins
        for key in available_plugins:
            if key not in self.instances:
                continue
            # create mahiro
            mahiro = GroupMessageMahiro.create_group_message_mahiro(id=key, ctx=ctx)
            # call
            await self.instances[key](mahiro)


# friend msg
class FriendMessage(BaseModel):
    userId: int
    userNickname: str = ""
    msg: Msg


class FriendMessageMahiro:
    ctx: FriendMessage
    sender: Sender
