from bridge.src.main import container, app

# plugins
from plugins.chinchin_pk_mahiro.main import chinchin_pk
from plugins.opqqq_plugins_mahiro.src.bot_good_morning import bot_good_morning
from plugins.opqqq_plugins_mahiro.src.bot_sign_in import bot_sign_in

# load plugins
container.add_group(id="牛了个牛", callback=chinchin_pk)
container.add_group(id="早晚安", callback=bot_good_morning)
container.add_group(id="签到", callback=bot_sign_in)

# load firend plugin
from plugins.friend_simple_mahiro.main import friend_simple_mahiro

container.add_friend(id="friend_simple_mahiro", callback=friend_simple_mahiro)
