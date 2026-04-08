#!/usr/bin/env python3
"""
Raspberry Pi WebSocket server for the Drone Blocks webapp.

Listens on ws://0.0.0.0:8765
Receives JSON commands from the browser, executes them on the drone,
and streams telemetry back every 500 ms.

To use real hardware, swap StubDrone for RealDrone (see real_drone.py).
"""
import asyncio
import json
import time
import websockets
from websockets.server import WebSocketServerProtocol

from stub_drone import StubDrone
# from real_drone import RealDrone   # ← uncomment to use real hardware
from runner import ScriptRunner

HOST = "0.0.0.0"
PORT = 8765
TELEMETRY_INTERVAL = 0.5  # seconds
VERSION = "1.0.0"

drone = StubDrone()
runner = ScriptRunner()
connected_clients: set[WebSocketServerProtocol] = set()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def send(ws: WebSocketServerProtocol, message: dict) -> None:
    try:
        await ws.send(json.dumps(message))
    except websockets.exceptions.ConnectionClosed:
        pass


async def broadcast(message: dict) -> None:
    if connected_clients:
        await asyncio.gather(*(send(ws, message) for ws in connected_clients))


# ---------------------------------------------------------------------------
# Telemetry loop
# ---------------------------------------------------------------------------

async def telemetry_loop() -> None:
    while True:
        await asyncio.sleep(TELEMETRY_INTERVAL)
        if connected_clients:
            data = drone.get_telemetry()
            data["type"] = "telemetry"
            data["timestamp"] = time.time()
            await broadcast(data)


# ---------------------------------------------------------------------------
# Message handler
# ---------------------------------------------------------------------------

async def handle_message(ws: WebSocketServerProtocol, raw: str) -> None:
    try:
        msg = json.loads(raw)
    except json.JSONDecodeError:
        await send(ws, {"type": "error", "message": "Invalid JSON", "code": "PARSE_ERROR"})
        return

    msg_type = msg.get("type")

    if msg_type == "ping":
        await send(ws, {"type": "pong", "version": VERSION})
        return

    if msg_type == "command":
        action = msg.get("action", "")
        await send(ws, {"type": "status", "message": f"Executing: {action}", "level": "debug"})

        loop = asyncio.get_event_loop()

        try:
            if action == "takeoff":
                await loop.run_in_executor(None, drone.takeoff)
            elif action == "land":
                await loop.run_in_executor(None, drone.land)
            elif action == "emergency_stop":
                await loop.run_in_executor(None, drone.emergency_stop)
            elif action == "move":
                direction = msg.get("direction", "forward")
                duration = float(msg.get("duration", 1.0))
                await loop.run_in_executor(None, drone.move, direction, duration)
            elif action == "rotate":
                degrees = float(msg.get("degrees", 90))
                await loop.run_in_executor(None, drone.rotate, degrees)
            elif action == "delay":
                seconds = float(msg.get("seconds", 1.0))
                await asyncio.sleep(seconds)
            else:
                await send(ws, {"type": "error", "message": f"Unknown action: {action}"})
                return
        except Exception as exc:
            await send(ws, {"type": "error", "message": str(exc)})
            return

        await send(ws, {"type": "status", "message": f"Done: {action}", "level": "info"})
        return

    if msg_type == "upload":
        code = msg.get("code", "")
        if not code.strip():
            await send(ws, {"type": "error", "message": "Empty code received"})
            return

        await send(ws, {"type": "status", "message": "Upload received — starting script...", "level": "info"})

        # Capture the loop before entering the thread callback
        loop = asyncio.get_event_loop()

        def on_output(line: str) -> None:
            asyncio.run_coroutine_threadsafe(
                send(ws, {"type": "status", "message": line, "level": "debug"}),
                loop
            )

        def on_done() -> None:
            asyncio.run_coroutine_threadsafe(
                send(ws, {"type": "status", "message": "Script finished.", "level": "success"}),
                loop
            )

        runner.run(code, on_output=on_output, on_done=on_done)
        return

    if msg_type == "abort":
        runner.abort()
        await send(ws, {"type": "status", "message": "Script aborted.", "level": "info"})
        return

    await send(ws, {"type": "error", "message": f"Unknown message type: {msg_type}"})


# ---------------------------------------------------------------------------
# Connection handler
# ---------------------------------------------------------------------------

async def handler(ws: WebSocketServerProtocol) -> None:
    client_addr = ws.remote_address
    print(f"[Server] Client connected: {client_addr}")
    connected_clients.add(ws)
    try:
        async for message in ws:
            await handle_message(ws, message)
    except websockets.exceptions.ConnectionClosedOK:
        pass
    except websockets.exceptions.ConnectionClosedError as exc:
        print(f"[Server] Connection closed with error: {exc}")
    finally:
        connected_clients.discard(ws)
        print(f"[Server] Client disconnected: {client_addr}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main() -> None:
    # Start telemetry broadcast loop
    asyncio.create_task(telemetry_loop())

    print(f"[Server] Drone Blocks RPi server v{VERSION}")
    print(f"[Server] Listening on ws://{HOST}:{PORT}")
    print(f"[Server] Using drone backend: {type(drone).__name__}")
    print("[Server] Press Ctrl+C to stop.\n")

    async with websockets.serve(handler, HOST, PORT):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[Server] Shutting down.")
