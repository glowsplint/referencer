from fastapi import WebSocket
import threading
import random
import string

# typechecking only
from typing import TypeVar, Generic, Tuple
from collections.abc import Sequence

from starlette.websockets import WebSocketDisconnect

K = TypeVar("K")
V = TypeVar("V")


class UniqueDict(Generic[K, V]):
    def __init__(self, keychars: Sequence[K] = string.ascii_uppercase, keylen: int = 6):
        self.dict: dict[K, V] = dict()
        self.lock = threading.Lock()
        self.keychars: Sequence[K] = keychars
        self.keylen: int = keylen

    def key_generate(self, value: V) -> Tuple[K]:
        tries = 10
        self.lock.acquire(timeout=5)  # wait at most 5 seconds
        while tries > 0:
            code = tuple(random.choices(self.keychars, k=self.keylen))
            if code not in self.dict:
                self.dict[code] = value
                self.lock.release()
                return code
            tries -= 1

    def __getitem__(self, key: K) -> V:
        return self.dict[key]

    def __contains__(self, key) -> bool:
        return key in self.dict

    def key_delete(self, key: K):
        del self.dict[key]


class Action:

    ID_HIGHLIGHT = 2
    ID_ANNOTATION = 1

    def pack(self):
        return {}

    @staticmethod
    def unpack(data):
        if "id" in data:
            if data["id"] == Action.ID_ANNOTATION:
                return Annotation.unpack(data)
            if data["id"] == Action.ID_HIGHLIGHT:
                return Highlight.unpack(data)


class Annotation(Action):
    def __init__(self, text, passage_id, pos, **kwargs):
        self.txt = text
        self.psg = passage_id
        self.pos = pos

    def pack(self):
        return {
            "id": Action.ID_ANNOTATION,
            "text": self.txt,
            "passage_id": self.psg,
            "pos": self.pos,
        }

    @staticmethod
    def unpack(data):
        if "text" in data and "passage_id" in data and "pos" in data:
            return Annotation(**data)


class Highlight(Action):
    def __init__(self, passage_id, start_pos, end_pos, **kwargs):
        self.psg = passage_id
        self.st = start_pos
        self.en = end_pos

    def pack(self):
        return {
            "id": Action.ID_HIGHLIGHT,
            "passage_id": self.psg,
            "start_pos": self.st,
            "end_pos": self.en,
        }

    @staticmethod
    def unpack(data):
        if "passage_id" in data and "start_pos" in data and "end_pos" in data:
            return Annotation(**data)


class Layer:
    def __init__(self):
        self.updates: dict[int, list[Action]] = dict()
        # TODO need a way to remove actions easily

    def action_add(self, data):
        if "user_id" in data and data["user_id"] in self.updates:
            act = Action.unpack(data)
            if act is not None:
                self.updates[data["user_id"]].append(act)

    def user_add(self, userid):
        self.updates[userid] = []


class User:
    def __init__(self, ws: WebSocket, space, username: str):
        self.ws = ws
        self.username = username
        self.space = space
        self.connected = True

    async def update(self, data):
        if self.connected:
            await self.ws.send_json(data)

    async def listen(self):
        try:
            while True:
                data = await self.ws.receive_json()
                await self.space.update(self, self.username, data)
        except WebSocketDisconnect:
            self.connected = False
            await self.space.user_disconnect(self, self.username)


class Space:

    MSG_USER_CONNECT = 1
    MSG_USER_DISCONNECT = 2

    MSG_PASSAGE_ADD = 16
    MSG_PASSAGE_REMOVE = 17

    MSG_ACTION_ADD = 32
    MSG_ACTION_REMOVE = 33

    def __init__(self):
        self.users: dict[int, User] = dict()
        self.layers: dict[int, Layer] = dict()
        self.passages: dict[int, str] = dict()

    async def update(self, userid: int, data: bytes):

        # first, update the server
        if "msg" in data:
            if (
                data["msg"] == Space.MSG_PASSAGE_ADD
                and "passage_id" in data
                and "passage_text" in data
            ):
                self.passages[data["passage_id"]] = data["passage_text"]
            elif data["msg"] == Space.MSG_PASSAGE_REMOVE and "passage_id" in data:
                self.passages.pop(data["passage_id"], None)
            elif data["msg"] == Space.MSG_ACTION_ADD and "layer_id" in data:
                self.layers[data["layer_id"]].action_add(data)

            # second, update everyone

            for un in self.users:
                if username != un:
                    await self.users[un].update(data)

    async def user_connect(self, userid: int, usr: User):
        self.users[userid] = User()
        for un in self.users:
            await self.users[un].update(
                username, {"msg": Space.MSG_USER_CONNECT, "user_name": usr.username}
            )
        for psg_id, psg_txt in self.passages.items():
            await usr.update(
                {
                    "msg": Space.MSG_PASSAGE_ADD,
                    "passage_id": psg_id,
                    "passage_text": psg_txt,
                }
            )

        # TODO send all past actions

    async def user_disconnect(self, username: str):
        for un in self.users:
            await self.users[un].update(
                username, {"msg": Space.MSG_USER_DISCONNECT, "user_name": username}
            )


class SpacesServer:
    def __init__(self):
        self.spaces = UniqueDict()
        self.users = UniqueDict(keychars=string.digits, keylen=16)

    async def user_connect(self, ws: WebSocket, space_id: str, username: str):
        if space_id in self.spaces:
            usr = User(ws, self.spaces[space_id], username)
            userid = int("".join(self.users.key_generate(usr)))
            await self.spaces[space_id].user_connect(userid)
            return usr

    def space_create(self):
        return "".join(self.spaces.key_generate(Space()))

