import base64
from io import BytesIO
from pathlib import Path

from .resources.bad_news import bad_news
from .resources.good_news import good_news


from mahiro import GroupMessageMahiro

bad_news_prefix = '悲报 '
good_news_prefix = '喜报 '

def byte_to_base64(byte: BytesIO):
    return base64.b64encode(byte.getvalue()).decode()

def byte_save(byte: BytesIO, path: str):
    with open(path, 'wb') as f:
        f.write(byte.getvalue())

cache_dir = Path(__file__).parent / 'cache'
cache_dir.mkdir(exist_ok=True)

async def memes(mahiro: GroupMessageMahiro):
    is_text = mahiro.extra.is_text
    if not is_text:
        return
    
    msg = mahiro.ctx.msg.Content.strip()
    if msg.startswith(good_news_prefix):
        text = msg.replace(good_news_prefix, '')
        output = good_news(None, [text], None)
    if msg.startswith(bad_news_prefix):
        text = msg.replace(bad_news_prefix, '')
        output = bad_news(None, [text], None)
    if output:
        file_name = f'{mahiro.ctx.userId}.jpg'
        file_path = cache_dir / file_name
        byte_save(output, file_path)
        mahiro.sender.send_to_group(
            group_id=mahiro.ctx.groupId,
            fast_image=file_path.as_posix()
        )