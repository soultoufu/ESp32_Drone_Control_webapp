#!/usr/bin/env python3
"""
Raspberry Pi MSP Serial Bridge
================================
Relays binary WebSocket frames (MSP packets) ↔ UART serial port.

No drone logic lives here — the browser generates all MSP commands.
The RPi simply forwards bytes in both directions.

Usage
-----
    python bridge.py

Requirements
------------
    pip install websockets pyserial-asyncio

FC Setup (one-time, via INAV / Betaflight Configurator)
-------------------------------------------------------
1. Ports tab  → enable MSP on the UART connected to the RPi, baud 115200
2. Configuration → Receiver → "MSP RX (control via MSP port)"
3. Modes → assign ANGLE mode to AUX2 channel range (e.g. 1300–2100)
4. Save and reboot

Wiring (RPi GPIO ↔ AT32F435 FC)
---------------------------------
    RPi GPIO 14 (TX)  →  FC UART RX
    RPi GPIO 15 (RX)  ←  FC UART TX
    GND               —  GND
"""
import asyncio
import json
import serial_asyncio
import websockets
from websockets.server import WebSocketServerProtocol

UART_PORT = '/dev/serial0'
UART_BAUD = 115200
WS_HOST   = '0.0.0.0'
WS_PORT   = 8765
VERSION   = '2.0.0'


async def handler(ws: WebSocketServerProtocol) -> None:
    print(f"[Bridge] Client connected: {ws.remote_address}")

    try:
        reader, writer = await serial_asyncio.open_serial_connection(
            url=UART_PORT, baudrate=UART_BAUD
        )
    except Exception as exc:
        print(f"[Bridge] Failed to open UART {UART_PORT}: {exc}")
        await ws.send(json.dumps({
            'type': 'error',
            'message': f'Cannot open UART {UART_PORT}: {exc}'
        }))
        return

    async def uart_to_ws() -> None:
        """Forward FC responses (binary MSP) → browser."""
        while True:
            data = await reader.read(256)
            if data:
                await ws.send(data)  # binary frame

    async def ws_to_uart() -> None:
        """Forward browser commands → FC UART."""
        async for message in ws:
            if isinstance(message, bytes):
                writer.write(message)
                await writer.drain()
            else:
                # Text frame: JSON control message (ping, etc.)
                try:
                    msg = json.loads(message)
                    if msg.get('type') == 'ping':
                        await ws.send(json.dumps({'type': 'pong', 'version': VERSION}))
                except (json.JSONDecodeError, KeyError):
                    pass

    try:
        await asyncio.gather(uart_to_ws(), ws_to_uart())
    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as exc:
        print(f"[Bridge] Error: {exc}")
    finally:
        writer.close()
        print(f"[Bridge] Client disconnected: {ws.remote_address}")


async def main() -> None:
    print(f"[Bridge] MSP serial bridge v{VERSION}")
    print(f"[Bridge] Listening on ws://{WS_HOST}:{WS_PORT}")
    print(f"[Bridge] UART: {UART_PORT} @ {UART_BAUD} baud")
    print("[Bridge] Press Ctrl+C to stop.\n")

    async with websockets.serve(handler, WS_HOST, WS_PORT):
        await asyncio.Future()  # run forever


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[Bridge] Shutting down.")
