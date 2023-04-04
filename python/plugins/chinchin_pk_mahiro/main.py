from plugins.chinchin_pk.src.main import message_processor, KEYWORDS
from plugins.chinchin_pk.src.utils import get_object_values, create_match_func_factory
from bridge.src.models import GroupMessageMahiro

keywords = get_object_values(KEYWORDS)
match_func = create_match_func_factory(fuzzy=True)

async def chinchin_pk(mahiro: GroupMessageMahiro):
    ctx = mahiro.ctx
    sender = mahiro.sender
    from_user = ctx.userId
    group = ctx.groupId
    nickname = ctx.userNickname
    content = ctx.msg.Content.strip()
    ats = ctx.msg.AtUinLists
    is_at_msg = len(ats) == 1
    is_text = mahiro.extra.is_text

    def impl_at_segment(qq: int):
        # 伪 at ，因为真 at 会风控
        return f'@{nickname}'

    def impl_send_message(qq: int, group: int, message: str):
        sender.send_to_group(group, message)
        return

    if is_at_msg:
        if not match_func(keywords=keywords, text=content):
            return
        target = ats[0].QQUid
        message_processor(
            message=content,
            qq=from_user,
            at_qq=target,
            group=group,
            fuzzy_match=True,
            nickname=nickname,
            impl_at_segment=impl_at_segment,
            impl_send_message=impl_send_message
        )
        return
    elif is_text:
        if not match_func(keywords=keywords, text=content):
            return
        message_processor(
            message=content,
            qq=from_user,
            group=group,
            fuzzy_match=True,
            nickname=nickname,
            impl_at_segment=impl_at_segment,
            impl_send_message=impl_send_message
        )
        return
