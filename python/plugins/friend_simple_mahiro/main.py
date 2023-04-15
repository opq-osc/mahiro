from bridge.src.models import FriendMessageMahiro


async def friend_simple_mahiro(mahiro: FriendMessageMahiro):
    content = mahiro.ctx.msg.Content.strip()
    if content == "hello":
        mahiro.sender.send_to_friend(user_id=mahiro.ctx.userId, msg="ok, i got it")
