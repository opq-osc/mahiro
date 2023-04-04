import os
import requests

UP_STREAM_URL = os.environ.get("MAHIRO_NODE_URL", "http://0.0.0.0:8098")
GROUP_URL = f"{UP_STREAM_URL}/recive/group"
FRIEND_URL = f"{UP_STREAM_URL}/recive/friend"


class Sender:
    @staticmethod
    def send_to_group(group_id: int, msg: str, imgs: list[str] = [], ats: list[int] = []):
        return requests.post(
            GROUP_URL,
            json={"groupId": group_id, "msg": {"Content": msg, "Images": imgs, "AtUinLists": ats}},
        )

    @staticmethod
    def send_to_friend(user_id: int, msg: str, imgs: list[str] = []):
        requests.post(
            FRIEND_URL,
            json={"userId": user_id, "msg": {"Content": msg, "Images": imgs}},
        )
        