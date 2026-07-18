from __future__ import annotations
import asyncio
import os
import starlette
from dataclasses import dataclass, field
from enum import Enum
from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
from typing import Any, Optional
from uuid import uuid4

from .errors import ClientError


TURN_SERVER = os.environ['TURN_SERVER']
TURN_USERNAME = os.environ['TURN_USERNAME']
TURN_PASSWORD = os.environ['TURN_PASSWORD']


def generate_uuid():
    return str(uuid4())


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ClientError)
async def client_error_handler(request: Request, exc: ClientError):
    return JSONResponse(status_code=400, content={
        "status": "error",
        "reason": str(exc)
    })


@app.get("/api/turn-server")
async def get_turn_server():
    return {
        "hostname": TURN_SERVER,
        "username": TURN_USERNAME,
        "password": TURN_PASSWORD,
    }


class WebsocketMessageType(str, Enum):
    CONNECT = 'connect'
    PING = 'ping'
    PONG = 'pong'
    SIGNALING = 'signaling'
    ROOM_JOIN = 'roomJoin'
    ROOM_DROP = 'roomDrop'
    PEER_JOIN = 'peerJoin'
    PEER_DROP = 'peerDrop'
    PEER_READY = 'peerReady'
    NULL_RESPONSE = 'null'


class WebsocketMessage(BaseModel):
    type: WebsocketMessageType
    id: Optional[int] = None
    data: Any = None


class ClientConnectData(BaseModel):
    name: str


class ServerConnectData(BaseModel):
    connId: str


class SignalingMessage(BaseModel):
    connId: str
    description: Any = None
    candidate: Any = None


class RoomJoinData(BaseModel):
    roomId: str


class PeerJoinData(BaseModel):
    connId: str
    name: str


class PeerDropData(BaseModel):
    connId: str


class PeerReadyData(BaseModel):
    connId: str


connections: dict[str, Connection] = {}
pools: dict[str, set[Connection]] = {}
empty_pool: set[Connection] = set()

def get_pool(pool_id: str) -> set[Connection]:
    return pools.get(pool_id, empty_pool)


@dataclass
class Connection:
    socket: WebSocket
    connected: bool = True
    name: str = ""
    pool_ids: set[str] = field(default_factory=set)
    room_id: Optional[str] = None
    conn_id: str = field(default_factory=generate_uuid)
    ready_peers: set[str] = set()

    def __hash__(self):
        return hash(id(self))

    async def handle_request(self, request: WebsocketMessage) -> WebsocketMessage | None:
        if request.type == WebsocketMessageType.PING:
            await self.send_message(WebsocketMessage(type=WebsocketMessageType.PONG))
        elif request.type == WebsocketMessageType.CONNECT:
            connect_data = ClientConnectData.model_validate(request.data)
            self.name = connect_data.name
        elif request.type == WebsocketMessageType.ROOM_JOIN:
            room_join_data = RoomJoinData.model_validate(request.data)
            if self.room_id != None:
                await self.room_drop()
            self.room_id = room_join_data.roomId
            await self.room_join()
        elif request.type == WebsocketMessageType.ROOM_DROP:
            await self.room_drop()
        elif request.type == WebsocketMessageType.SIGNALING:
            signalingMessage = SignalingMessage.model_validate(request.data)
            dest_conn_id = signalingMessage.connId
            signalingMessage.connId = self.conn_id
            await websocket_broadcast(WebsocketMessage(
                type=WebsocketMessageType.SIGNALING,
                data=signalingMessage,
            ), pool_id=dest_conn_id)
        elif request.type == WebsocketMessageType.PEER_READY:
            peerReadyData = PeerReadyData.model_validate(request.data)
            self.ready_peers.add(peerReadyData.connId)

            peer = connections.get(peerReadyData.connId, None)
            if peer is None:
                return None

            while self.conn_id not in peer.ready_peers and peer.connected:
                await asyncio.sleep(0.1)

            if not peer.connected:
                return None

            return WebsocketMessage(type=WebsocketMessageType.PEER_READY, data=peerReadyData)


    async def send_message(self, message: WebsocketMessage):
        await self.socket.send_json(message.model_dump(mode="json"))

    async def room_join(self):
        tasks = []
        tasks.append(websocket_broadcast(WebsocketMessage(
            type=WebsocketMessageType.PEER_JOIN,
            data=PeerJoinData(connId=self.conn_id, name=self.name)
        ), pool_id=self.room_id))
        for peer in get_pool(self.room_id):
            tasks.append(self.send_message(WebsocketMessage(
                type=WebsocketMessageType.PEER_JOIN,
                data=PeerJoinData(connId=peer.conn_id, name=peer.name)
            )))
        self.add_pool(self.room_id)
        await asyncio.gather(*tasks, return_exceptions=True)

    async def room_drop(self):
        self.drop_pool(self.room_id)
        await websocket_broadcast(WebsocketMessage(
            type=WebsocketMessageType.PEER_DROP,
            data=PeerDropData(connId=self.conn_id)
        ), pool_id=self.room_id)
        self.room_id = None

    def add_pool(self, pool_id: str):
        pool = pools.get(pool_id, None)
        if pool is None:
            pool = set()
            pools[pool_id] = pool
        pool.add(self)
        self.pool_ids.add(pool_id)

    def drop_pool(self, pool_id: str):
        pool = pools.get(pool_id, None)
        if pool is None:
            return
        pool.discard(self)
        if len(pool) == 0:
            pools.pop(pool_id, None)
        self.pool_ids.discard(pool_id)

    async def cleanup(self):
        self.connected = False
        if self.room_id:
            await self.room_drop()
        for pool_id in tuple(self.pool_ids):
            self.drop_pool(pool_id)
        connections.pop(self.conn_id, None)


@app.websocket("/api/ws")
async def alerts_websocket(websocket: WebSocket):
    await websocket.accept()

    connection = Connection(websocket)
    print("Connection Opened", connection.conn_id)

    connections[connection.conn_id] = connection
    connection.add_pool('*')
    connection.add_pool(connection.conn_id)

    try:
        await connection.send_message(WebsocketMessage(
            type=WebsocketMessageType.CONNECT,
            data=ServerConnectData(connId=connection.conn_id),
        ))
        while True:
            request = WebsocketMessage.model_validate(await connection.socket.receive_json())
            response = await connection.handle_request(request)
            if request.id is not None:
                if response is None:
                    response = WebsocketMessage(type=WebsocketMessageType.NULL_RESPONSE)
                response.id = request.id
                await connection.send_message(response)
    except starlette.websockets.WebSocketDisconnect:
        pass
    except ValidationError as e:
        print("ValidationError", connection.conn_id, e.errors())
    finally:
        await connection.cleanup()
        print("Connection Closed", connection.conn_id)


async def websocket_broadcast(message: WebsocketMessage, pool_id: str = '*'):
    pool = pools.get(pool_id, None)
    if pool is None:
        return

    serialized_message = message.model_dump(mode="json")
    attempts = []
    for connection in pool:
        try:
            attempts.append(connection.socket.send_json(serialized_message))
        except:
            pass
    await asyncio.gather(*attempts, return_exceptions=True)
