# Drone Blocks - MVP Walkthrough

The visual programming environment for your ESP32-based drone is ready.

## Features implemented:
- **Simplified Toolbox**: Focused on flight control (Takeoff, Land, Emergency Stop) and movement.
- **Smarter Inputs**: Uses "Shadow Blocks" so you can type numbers directly into move/wait blocks without dragging extra pieces.
- **Automatic Telemetry**: You no longer need blocks to "get" battery or altitude. The app now injects a background thread into your code that automatically reports telemetry to the dashboard every second.
- **MicroPython Generation**: Converts blocks into standard drone library calls.
- **Web Serial Upload**: Direct USB upload to ESP32.

## How to use:
1. **Connect**: Plug in your ESP32 and click "Connect ESP32 (USB)".
2. **Program**: Drag `Takeoff`, `Move`, and `Rotate` blocks.
3. **Loop**: Use the `Loops` category to repeat maneuvers.
4. **Run**: Click "Upload & Run".
5. **Monitor**: Switch to the **Telemetry** tab to see live battery, height, and speed data updated automatically from the background task.

## New Generated Code Structure:
When you upload code, the app now automatically includes this at the top:
```python
import drone
import time
import _thread
import json

def telemetry_loop():
    while True:
        # Automatically reports status to the WebApp
        data = {"type": "telemetry", ...}
        print(json.dumps(data))
        time.sleep(1)

_thread.start_new_thread(telemetry_loop, ())
```
This ensures the Telemetry Panel always has data without you having to add specific blocks for it.
