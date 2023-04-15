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
    qq: int
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
        sender = Sender(id=id, qq=ctx.qq)
        return GroupMessageMahiro(ctx=ctx, sender=sender, extra=extra)


# friend msg
class FriendMessage(BaseModel):
    userId: int
    userNickname: str = ""
    msg: Msg
    qq: int


class FriendMessageMahiro:
    ctx: FriendMessage
    sender: Sender

    def __init__(self, ctx: FriendMessage, sender: Sender):
        self.ctx = ctx
        self.sender = sender
    
    @staticmethod
    def create_friend_message_mahiro(id: str, ctx: FriendMessage):
        sender = Sender(id=id, qq=ctx.qq)
        return FriendMessageMahiro(ctx=ctx, sender=sender)


class MessageContainer:
    instances: dict[str, Awaitable] = {}
    friend_instances: dict[str, Awaitable] = {}

    def __init__(self):
        pass

    def __register_plugin_to_node(self, id: str):
        try:
            requests.post(
                Sender.REGISTER_PLUGIN_URL,
                json={"name": id},
            )
            print(f"register plugin [{id}] to node success")
        except Exception as e:
            print("register plugin to node error: ", e)
        
    def register_all_plugins(self):
        for key in self.instances:
            self.__register_plugin_to_node(id=key)

    def add_group(self, id: str, callback: Awaitable):
        """
        register group message plugin
        """
        self.instances[id] = callback

    def add_friend(self, id: str, callback: Awaitable):
        """
        register friend message plugin
        """
        print("register friend plugin: ", id)
        self.friend_instances[id] = callback

    async def call_group(self, ctx: GroupMessage):
        available_plugins = ctx.configs.availablePlugins
        for key in available_plugins:
            if key not in self.instances:
                continue
            # create mahiro
            mahiro = GroupMessageMahiro.create_group_message_mahiro(id=key, ctx=ctx)
            # call
            await self.instances[key](mahiro)

    async def call_friend(self, ctx: FriendMessage):
        for key in self.friend_instances:
            # create mahiro
            mahiro = FriendMessageMahiro.create_friend_message_mahiro(id=key, ctx=ctx)
            # call
            await self.friend_instances[key](mahiro)
