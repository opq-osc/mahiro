import os
import requests
from pydantic import BaseModel

UP_STREAM_URL = os.environ.get("MAHIRO_NODE_URL", "http://0.0.0.0:8098")


class AtUin(BaseModel):
    Uin: int
    Nick: str = ""


class Image(BaseModel):
    FileId: int
    FileMd5: str
    FileSize: int


class Sender:
    id: str

    GROUP_URL = f"{UP_STREAM_URL}/api/v1/recive/group"
    FRIEND_URL = f"{UP_STREAM_URL}/api/v1/recive/friend"
    REGISTER_PLUGIN_URL = f"{UP_STREAM_URL}/api/v1/panel/plugin/register"

    def __init__(self, id: str):
        self.id = id

    def create_configs(self):
        return {"configs": {"id": self.id}}

    def send_to_group(
        self,
        group_id: int,
        msg: str = "",
        imgs: list[Image] = [],
        ats: list[AtUin] = [],
        fast_image: str = None,
    ):
        json = {
            "groupId": group_id,
            "msg": {
                "Content": msg,
                "Images": imgs,
                "AtUinLists": ats,
            },
            "configs": self.create_configs(),
        }
        if fast_image:
            json["fastImage"] = fast_image
        return requests.post(
            Sender.GROUP_URL,
            json=json,
        )

    def send_to_friend(
        self,
        user_id: int,
        msg: str = "",
        imgs: list[Image] = [],
        fast_image: str = None,
    ):
        json = {
            "userId": user_id,
            "msg": {"Content": msg, "Images": imgs},
        }
        if fast_image:
            json["fastImage"] = fast_image
        requests.post(
            Sender.FRIEND_URL,
            json=json,
        )
