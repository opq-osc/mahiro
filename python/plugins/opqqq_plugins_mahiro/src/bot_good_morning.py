import datetime
import os
import random
from enum import Enum

from dateutil.parser import parse

from bridge.mahiro import GroupMessageMahiro

try:
    import ujson as json
except ImportError:
    import json

# ==========================================

RESOURCES_BASE_PATH = os.path.join(
    os.path.dirname(__file__), "..", "resources", "good-morning"
)

# ==========================================

# 屏蔽群 例：[12345678, 87654321]
blockGroupNumber = []
# 早安指令
goodMorningInstructionSet = ["早", "早安", "哦哈哟", "ohayo", "ohayou", "早安啊", "早啊", "早上好"]
# 晚安指令
goodNightInstructionSet = ["晚", "晚安", "哦呀斯密", "oyasumi", "oyasimi", "睡了", "睡觉了"]

# ==========================================


async def bot_good_morning(mahiro: GroupMessageMahiro):
    ctx = mahiro.ctx
    is_text = mahiro.extra.is_text
    userGroup = ctx.groupId

    if Tools.commandMatch(userGroup, blockGroupNumber):
        return

    if not is_text:
        return

    userQQ = ctx.userId
    msg = ctx.msg.Content.strip()
    nickname = ctx.userNickname

    will_send_msg = mainProgram(userQQ, userGroup, msg, nickname)
    if will_send_msg and len(will_send_msg) > 0:
        mahiro.sender.send_to_group(userGroup, will_send_msg)


class Model(Enum):

    ALL = "_all"

    BLURRY = "_blurry"

    SEND_AT = "_send_at"

    SEND_DEFAULT = "_send_default"


class Status(Enum):

    SUCCESS = "_success"

    FAILURE = "_failure"


class Tools:
    @staticmethod
    def readJsonFile(p):
        if not os.path.exists(p):
            return Status.FAILURE
        with open(p, "r", encoding="utf-8") as f:
            return json.loads(f.read())

    @staticmethod
    def writeJsonFile(p, content):
        with open(p, "w", encoding="utf-8") as f:
            f.write(json.dumps(content))
        return Status.SUCCESS

    @staticmethod
    def commandMatch(msg, commandList, model=Model.ALL):
        if model == Model.ALL:
            for c in commandList:
                if c == msg:
                    return True
        if model == Model.BLURRY:
            for c in commandList:
                if msg.find(c) != -1:
                    return True
        return False

    @staticmethod
    def checkFolder(dir):
        if not os.path.exists(dir):
            os.makedirs(dir)

    @staticmethod
    def atQQ(userNickName):
        return f"@{userNickName}\n"


class Utils:
    @staticmethod
    def userInformationReading(userQQ):
        p = f"{RESOURCES_BASE_PATH}/Data/User/{userQQ}.json"
        content = Tools.readJsonFile(p)
        return content

    @staticmethod
    def userInformationWriting(userQQ, info):
        Tools.checkFolder(f"{RESOURCES_BASE_PATH}/Data/User")
        p = f"{RESOURCES_BASE_PATH}/Data/User/{userQQ}.json"
        Tools.writeJsonFile(p, info)
        return Status.SUCCESS

    @staticmethod
    def groupRead(userGroup):
        p = f"{RESOURCES_BASE_PATH}/Data/Group/{userGroup}.json"
        group = Tools.readJsonFile(p)
        return group

    @staticmethod
    def groupWrite(userGroup, info):
        Tools.checkFolder(f"{RESOURCES_BASE_PATH}/Data/Group")
        p = f"{RESOURCES_BASE_PATH}/Data/Group/{userGroup}.json"
        Tools.writeJsonFile(p, info)
        return Status.SUCCESS

    @staticmethod
    def readConfiguration(model):
        content = ""
        if model == GoodMorningModel.MORNING_MODEL.value:
            content = Tools.readJsonFile(
                f"{RESOURCES_BASE_PATH}/Config/GoodMorning.json"
            )
        if model == GoodMorningModel.NIGHT_MODEL.value:
            content = Tools.readJsonFile(f"{RESOURCES_BASE_PATH}/Config/GoodNight.json")
        if content == Status.FAILURE:
            raise Exception("缺少早晚安配置文件！")
        return content

    @classmethod
    def extractRandomWords(cls, model, nickname):
        return random.choice((cls.readConfiguration(model))["statement"])[
            "content"
        ].replace(r"{name}", nickname)

    @classmethod
    def extractConfigurationInformationAccordingToSpecifiedParameters(
        cls, parameter, model
    ):
        return (cls.readConfiguration(model))[parameter]


class TimeUtils:
    @staticmethod
    def getTheCurrentTime():
        nowDate = str(datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d"))
        return nowDate

    @staticmethod
    def getAccurateTimeNow():
        nowDate = str(
            datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d/%H:%M:%S")
        )
        return nowDate

    @classmethod
    def judgeTimeDifference(cls, lastTime):
        timeNow = cls.getAccurateTimeNow()
        a = parse(lastTime)
        b = parse(timeNow)
        return int((b - a).total_seconds() / 3600)

    @staticmethod
    def getTheCurrentHour():
        return int(str(datetime.datetime.strftime(datetime.datetime.now(), "%H")))

    @classmethod
    def calculateTheElapsedTimeCombination(cls, lastTime):
        timeNow = cls.getAccurateTimeNow()
        a = parse(lastTime)
        b = parse(timeNow)
        seconds = int((b - a).total_seconds())
        return [int(seconds / 3600), int((seconds % 3600) / 60), int(seconds % 60)]

    @staticmethod
    def replaceHourMinuteAndSecond(parameterList, msg):
        return (
            msg.replace(r"{hour}", str(parameterList[0]))
            .replace(r"{minute}", str(parameterList[1]))
            .replace(r"{second}", str(parameterList[2]))
        )


def mainProgram(userQQ, userGroup, msg, nickname):
    # Good morning match
    if Tools.commandMatch(msg, goodMorningInstructionSet):
        sendMsg = goodMorningInformation(userQQ, userGroup, nickname)
        return sendMsg
    # Good night detection
    if Tools.commandMatch(msg, goodNightInstructionSet):
        sendMsg = goodNightInformation(userQQ, userGroup, nickname)
        return sendMsg


class GoodMorningModel(Enum):

    MORNING_MODEL = "MORNING_MODEL"

    NIGHT_MODEL = "NIGHT_MODEL"


def userRegistration(userQQ, model):
    registrationStructure = {
        "qq": userQQ,
        "model": model,
        "time": TimeUtils.getTheCurrentTime(),
        "accurateTime": TimeUtils.getAccurateTimeNow(),
    }
    Utils.userInformationWriting(userQQ, registrationStructure)
    return Status.SUCCESS


def createACheckInPool(userGroup, model):
    signInPoolStructure = {
        "qun": userGroup,
        "time": TimeUtils.getTheCurrentTime(),
        "accurateTime": TimeUtils.getAccurateTimeNow(),
        "userList": [],
        "number": 0,
    }
    Utils.groupWrite(str(userGroup) + "-" + model, signInPoolStructure)
    return Status.SUCCESS


def addToCheckInPoolAndGetRanking(userQQ, userGroup, model):
    if model == GoodMorningModel.MORNING_MODEL.value:
        # Check if there is a check-in pool
        content = Utils.groupRead(str(userGroup) + "-" + model)
        if content == Status.FAILURE:
            # Create a check-in pool
            createACheckInPool(userGroup, model)
            content = Utils.groupRead(str(userGroup) + "-" + model)
        # Check if the pool has expired
        if content["time"] != TimeUtils.getTheCurrentTime():
            # Expired, rebuild the pool
            createACheckInPool(userGroup, model)
            content = Utils.groupRead(str(userGroup) + "-" + model)
        # Add users to the check-in pool
        user = Utils.userInformationReading(userQQ)
        content["userList"].append(user)
        content["number"] += 1
        Utils.groupWrite(str(userGroup) + "-" + model, content)
        return content["number"]
    if model == GoodMorningModel.NIGHT_MODEL.value:
        # Check if there is a check-in pool
        content = Utils.groupRead(str(userGroup) + "-" + model)
        if content == Status.FAILURE:
            # Create a check-in pool
            createACheckInPool(userGroup, model)
            content = Utils.groupRead(str(userGroup) + "-" + model)
        # Check if the pool has expired
        hourNow = TimeUtils.getTheCurrentHour()
        expiryId = False
        if content["time"] != TimeUtils.getTheCurrentTime():
            if TimeUtils.judgeTimeDifference(content["accurateTime"]) < 24:
                if hourNow >= 12:
                    expiryId = True
            else:
                expiryId = True
        if expiryId:
            # Expired, rebuild the pool
            createACheckInPool(userGroup, model)
            content = Utils.groupRead(str(userGroup) + "-" + model)
        # Add users to the check-in pool
        user = Utils.userInformationReading(userQQ)
        content["userList"].append(user)
        content["number"] += 1
        Utils.groupWrite(str(userGroup) + "-" + model, content)
        return content["number"]
    return None


def goodMorningInformation(userQQ, userGroup, nickname):
    # Check if registered
    registered = Utils.userInformationReading(userQQ)
    send = Tools.atQQ(nickname)
    if registered == Status.FAILURE:
        # registered
        userRegistration(userQQ, GoodMorningModel.MORNING_MODEL.value)
        # Add to check-in pool and get ranking
        rank = addToCheckInPoolAndGetRanking(
            userQQ, userGroup, GoodMorningModel.MORNING_MODEL.value
        )
        send += (
            Utils.extractRandomWords(GoodMorningModel.MORNING_MODEL.value, nickname)
            + "\n"
            + (
                Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                    "suffix", GoodMorningModel.MORNING_MODEL.value
                )
            ).replace(r"{number}", str(rank))
        )
        return send
    # Already registered
    if registered["model"] == GoodMorningModel.MORNING_MODEL.value:
        # too little time
        if TimeUtils.judgeTimeDifference(registered["accurateTime"]) <= 4:
            send += Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                "triggered", GoodMorningModel.MORNING_MODEL.value
            )
            return send
        # Good morning no twice a day
        if registered["time"] != TimeUtils.getTheCurrentTime():
            userRegistration(userQQ, GoodMorningModel.MORNING_MODEL.value)
            rank = addToCheckInPoolAndGetRanking(
                userQQ, userGroup, GoodMorningModel.MORNING_MODEL.value
            )
            send += (
                Utils.extractRandomWords(GoodMorningModel.MORNING_MODEL.value, nickname)
                + "\n"
                + (
                    Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                        "suffix", GoodMorningModel.MORNING_MODEL.value
                    )
                ).replace(r"{number}", str(rank))
            )
            return send
    if registered["model"] == GoodMorningModel.NIGHT_MODEL.value:
        sleepingTime = TimeUtils.judgeTimeDifference(registered["accurateTime"])
        # too little time
        if sleepingTime <= 4:
            send += Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                "unable_to_trigger", GoodMorningModel.MORNING_MODEL.value
            )
            return send
        # Sleep time cannot exceed 24 hours
        userRegistration(userQQ, GoodMorningModel.MORNING_MODEL.value)
        if sleepingTime < 24:
            send += Utils.extractRandomWords(
                GoodMorningModel.MORNING_MODEL.value, nickname
            )
            # Calculate Wake Up Ranking
            rank = addToCheckInPoolAndGetRanking(
                userQQ, userGroup, GoodMorningModel.MORNING_MODEL.value
            )
            send += (
                Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                    "suffix", GoodMorningModel.MORNING_MODEL.value
                )
            ).replace(r"{number}", str(rank)) + "\n"
            # Calculate precise sleep time
            sleepPreciseTime = TimeUtils.calculateTheElapsedTimeCombination(
                registered["accurateTime"]
            )
            if sleepPreciseTime[0] >= 9:
                send += TimeUtils.replaceHourMinuteAndSecond(
                    sleepPreciseTime,
                    (Utils.readConfiguration(GoodMorningModel.MORNING_MODEL.value))[
                        "sleeping_time"
                    ][1]["content"],
                )
            elif sleepPreciseTime[0] >= 7:
                send += TimeUtils.replaceHourMinuteAndSecond(
                    sleepPreciseTime,
                    (Utils.readConfiguration(GoodMorningModel.MORNING_MODEL.value))[
                        "sleeping_time"
                    ][0]["content"],
                )
            else:
                send += TimeUtils.replaceHourMinuteAndSecond(
                    sleepPreciseTime,
                    (Utils.readConfiguration(GoodMorningModel.MORNING_MODEL.value))[
                        "too_little_sleep"
                    ],
                )
        else:
            rank = addToCheckInPoolAndGetRanking(
                userQQ, userGroup, GoodMorningModel.MORNING_MODEL.value
            )
            send += (
                Utils.extractRandomWords(GoodMorningModel.MORNING_MODEL.value, nickname)
                + "\n"
                + (
                    Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                        "suffix", GoodMorningModel.MORNING_MODEL.value
                    )
                ).replace(r"{number}", str(rank))
            )
        return send
    return Status.FAILURE


def goodNightInformation(userQQ, userGroup, nickname):
    # Check if registered
    registered = Utils.userInformationReading(userQQ)
    send = Tools.atQQ(nickname)
    if registered == Status.FAILURE:
        # registered
        userRegistration(userQQ, GoodMorningModel.NIGHT_MODEL.value)
        # Add to check-in pool and get ranking
        rank = addToCheckInPoolAndGetRanking(
            userQQ, userGroup, GoodMorningModel.NIGHT_MODEL.value
        )
        send += (
            Utils.extractRandomWords(GoodMorningModel.NIGHT_MODEL.value, nickname)
            + "\n"
            + (
                Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                    "suffix", GoodMorningModel.NIGHT_MODEL.value
                )
            ).replace(r"{number}", str(rank))
        )
        return send
    # Already registered
    if registered["model"] == GoodMorningModel.NIGHT_MODEL.value:
        # too little time
        if TimeUtils.judgeTimeDifference(registered["accurateTime"]) <= 4:
            send += Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                "triggered", GoodMorningModel.NIGHT_MODEL.value
            )
            return send
        # Two good nights can not be less than 12 hours
        if TimeUtils.judgeTimeDifference(registered["accurateTime"]) >= 12:
            userRegistration(userQQ, GoodMorningModel.NIGHT_MODEL.value)
            rank = addToCheckInPoolAndGetRanking(
                userQQ, userGroup, GoodMorningModel.NIGHT_MODEL.value
            )
            send += (
                Utils.extractRandomWords(GoodMorningModel.NIGHT_MODEL.value, nickname)
                + "\n"
                + (
                    Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                        "suffix", GoodMorningModel.NIGHT_MODEL.value
                    )
                ).replace(r"{number}", str(rank))
            )
            return send
    if registered["model"] == GoodMorningModel.MORNING_MODEL.value:
        soberTime = TimeUtils.judgeTimeDifference(registered["accurateTime"])
        # too little time
        if soberTime <= 4:
            send += Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                "unable_to_trigger", GoodMorningModel.NIGHT_MODEL.value
            )
            return send
        # sober time cannot exceed 24 hours
        userRegistration(userQQ, GoodMorningModel.NIGHT_MODEL.value)
        if soberTime < 24:
            send += Utils.extractRandomWords(
                GoodMorningModel.NIGHT_MODEL.value, nickname
            )
            rank = addToCheckInPoolAndGetRanking(
                userQQ, userGroup, GoodMorningModel.NIGHT_MODEL.value
            )
            send += (
                Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                    "suffix", GoodMorningModel.NIGHT_MODEL.value
                )
            ).replace(r"{number}", str(rank)) + "\n"
            soberAccurateTime = TimeUtils.calculateTheElapsedTimeCombination(
                registered["accurateTime"]
            )
            if soberAccurateTime[0] >= 12:
                send += TimeUtils.replaceHourMinuteAndSecond(
                    soberAccurateTime,
                    (Utils.readConfiguration(GoodMorningModel.NIGHT_MODEL.value))[
                        "working_hours"
                    ][2]["content"],
                )
            else:
                send += TimeUtils.replaceHourMinuteAndSecond(
                    soberAccurateTime,
                    random.choice(
                        (Utils.readConfiguration(GoodMorningModel.NIGHT_MODEL.value))[
                            "working_hours"
                        ]
                    )["content"],
                )
        else:
            rank = addToCheckInPoolAndGetRanking(
                userQQ, userGroup, GoodMorningModel.NIGHT_MODEL.value
            )
            send += (
                Utils.extractRandomWords(GoodMorningModel.NIGHT_MODEL.value, nickname)
                + "\n"
                + (
                    Utils.extractConfigurationInformationAccordingToSpecifiedParameters(
                        "suffix", GoodMorningModel.NIGHT_MODEL.value
                    )
                ).replace(r"{number}", str(rank))
            )
        return send
    return Status.FAILURE


# check data folders
Tools.checkFolder(f"{RESOURCES_BASE_PATH}/Data/User")
Tools.checkFolder(f"{RESOURCES_BASE_PATH}/Data/Group")
