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
from typing import Any

from .errors import ClientError


TURN_SERVER = os.environ['TURN_SERVER']
TURN_USERNAME = os.environ['TURN_USERNAME']
TURN_PASSWORD = os.environ['TURN_PASSWORD']


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
    PING = 'ping'
    PONG = 'pong'
    ALERT = 'alert'


class WebsocketMessage(BaseModel):
    type: WebsocketMessageType
    data: Any = None


pools: dict[str, set[Connection]] = {}


@dataclass
class Connection:
    socket: WebSocket
    pools: set[str] = field(default_factory=set)

    def __hash__(self):
        return hash(id(self))

    async def handle_request(self, request: WebsocketMessage):
        if request.type == WebsocketMessageType.PING:
            await self.send_message(WebsocketMessage(type=WebsocketMessageType.PONG))

    async def send_message(self, message: WebsocketMessage):
        await self.socket.send_json(message.model_dump(mode="json"))


@app.websocket("/api/ws")
async def alerts_websocket(websocket: WebSocket):
    await websocket.accept()

    connection = Connection(websocket)
    connection.add_pool('*')

    try:
        while True:
            await connection.handle_request(WebsocketMessage.model_validate(await connection.socket.receive_json()))
    except starlette.websockets.WebSocketDisconnect:
        pass
    except ValidationError:
        pass
    finally:
        alert_connections.discard(connection)


async def websocket_broadcast(message: WebsocketMessage, pool_id: str = '*'):
    serialized_message = message.model_dump(mode="json")
    attempts = []
    for connection in alert_connections:
        try:
            attempts.append(connection.socket.send_json(serialized_message))
        except:
            pass
    await asyncio.gather(*attempts)
