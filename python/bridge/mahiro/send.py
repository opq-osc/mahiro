import os
import requests
from typing import List
from pydantic import BaseModel

UP_STREAM_URL = os.environ.get("MAHIRO_NODE_URL", "http://0.0.0.0:8098")
MAHIRO_TOKEN_HEADER = "x-mahiro-token"


class AtUin(BaseModel):
    Uin: int
    Nick: str = ""


class Image(BaseModel):
    FileId: int
    FileMd5: str
    FileSize: int


class Sender:
    id: str
    __token: str
    # from qq
    qq: int

    __GROUP_URL = f"{UP_STREAM_URL}/api/v1/recive/group"
    __FRIEND_URL = f"{UP_STREAM_URL}/api/v1/recive/friend"
    REGISTER_PLUGIN_URL = f"{UP_STREAM_URL}/api/v1/panel/plugin/register"
    GET_TOKEN_URL = f"{UP_STREAM_URL}/api/v1/panel/auth/gettoken"

    def __init__(self, id: str, qq: int, token: str):
        self.id = id
        self.qq = qq
        self.__token = token

    def __create_configs(self):
        return {"id": self.id}

    def __create_headers(self):
        headers = {}
        headers[MAHIRO_TOKEN_HEADER] = self.__token
        return headers

    def send_to_group(
        self,
        group_id: int,
        msg: str = "",
        imgs: List[Image] = [],
        ats: List[AtUin] = [],
        fast_image: str = None,
    ):
        json = {
            "groupId": group_id,
            "msg": {
                "Content": msg,
                "Images": imgs,
                "AtUinLists": ats,
            },
            "qq": self.qq,
            "configs": self.__create_configs(),
        }
        if fast_image:
            json["fastImage"] = fast_image
        print("send_to_group to", json["groupId"])
        requests.post(
            self.__GROUP_URL,
            json=json,
            timeout=5,
            headers=self.__create_headers(),
        )

    def send_to_friend(
        self,
        user_id: int,
        msg: str = "",
        imgs: List[Image] = [],
        fast_image: str = None,
    ):
        json = {
            "userId": user_id,
            "msg": {"Content": msg, "Images": imgs},
            "qq": self.qq,
            "configs": self.__create_configs(),
        }
        if fast_image:
            json["fastImage"] = fast_image
        print("send_to_friend to", json["userId"])
        requests.post(
            self.__FRIEND_URL,
            json=json,
            timeout=5,
            headers=self.__create_headers(),
        )
