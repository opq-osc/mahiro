import time
import requests
import asyncio
from termcolor import colored
from pydantic import BaseModel
from typing import Awaitable, List, Dict

from .send import Sender, AtUin, Image, MAHIRO_TOKEN_HEADER

class Msg(BaseModel):
    SubMsgType: int
    Content: str = ""
    AtUinLists: List[AtUin] = []
    Images: List[Image] = []
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
    availablePlugins: List[str] = []


class GroupMessage(BaseModel):
    userId: int
    userNickname: str = ""
    groupId: int
    groupNickname: str = ""
    msg: Msg
    # internal fields
    configs: GroupMessageConfigs
    # bot qq
    qq: int
    # opq raw data
    raw: dict = {}


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
    def create_group_message_mahiro(id: str, ctx: GroupMessage, token: str):
        is_text = ctx.msg.SubMsgType == SubMsgType.mixed
        extra = GroupMessageExtra(is_text=is_text)
        sender = Sender(id=id, qq=ctx.qq, token=token)
        return GroupMessageMahiro(ctx=ctx, sender=sender, extra=extra)


# friend msg
class FriendMessage(BaseModel):
    userId: int
    userName: str = ""
    msg: Msg
    # bot qq
    qq: int
    # opq raw data
    raw: dict = {}


class FriendMessageMahiro:
    ctx: FriendMessage
    sender: Sender

    def __init__(self, ctx: FriendMessage, sender: Sender):
        self.ctx = ctx
        self.sender = sender

    @staticmethod
    def create_friend_message_mahiro(id: str, ctx: FriendMessage, token: str):
        sender = Sender(id=id, qq=ctx.qq, token=token)
        return FriendMessageMahiro(ctx=ctx, sender=sender)


class MessageContainer:
    instances: Dict[str, Awaitable] = {}
    friend_instances: Dict[str, Awaitable] = {}
    __token: str = ""

    def __init__(self):
        pass

    def set_token(self, token: str):
        self.__token = token

    def __register_plugin_to_node(self, id: str):
        headers = {}
        headers[MAHIRO_TOKEN_HEADER] = self.__token
        requests.post(
            Sender.REGISTER_PLUGIN_URL,
            json={"name": id},
            headers=headers,
        )
        print(f"register plugin [{id}] to node success")

    def want_get_token(self):
        try:
            requests.get(
                Sender.GET_TOKEN_URL,
            )
        except Exception as e:
            print(colored("get token error: ", "red"), e)
            print("Retry after 5 seconds...")
            time.sleep(5)
            self.want_get_token()

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
        tasks = []
        available_plugins = ctx.configs.availablePlugins
        for key in available_plugins:
            if key not in self.instances:
                continue
            # create mahiro
            mahiro = GroupMessageMahiro.create_group_message_mahiro(
                id=key, ctx=ctx, token=self.__token
            )
            # call
            tasks.append(self.instances[key](mahiro))
        if len(tasks) > 0:
            await asyncio.gather(*tasks)

    async def call_friend(self, ctx: FriendMessage):
        tasks = []
        for key in self.friend_instances:
            # create mahiro
            mahiro = FriendMessageMahiro.create_friend_message_mahiro(
                id=key, ctx=ctx, token=self.__token
            )
            # call
            tasks.append(self.friend_instances[key](mahiro))
        if len(tasks) > 0:
            await asyncio.gather(*tasks)


class Auth(BaseModel):
    token: str
