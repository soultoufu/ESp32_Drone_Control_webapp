# Raspberry Pi Drone Server

Python WebSocket server that bridges the **Drone Blocks** webapp and the physical drone hardware.

## Requirements

- Raspberry Pi (any model with WiFi — Zero 2W, 3B+, 4, 5)
- Python 3.8+
- Dependencies: `pip install -r requirements.txt`

## Quick Start

```bash
# 1. Copy this folder to your Raspberry Pi
scp -r raspberry_pi/ pi@raspberrypi.local:~/drone-server/

# 2. SSH in and install dependencies
ssh pi@raspberrypi.local
cd ~/drone-server
pip install -r requirements.txt

# 3. Run the server (uses StubDrone by default — no hardware needed)
python server.py
```

The server listens on **port 8765** on all interfaces.

## Connecting the Webapp

1. Open the Drone Blocks webapp in Chrome/Edge on a device on the same network.
2. Click **"Connect to RPi"**.
3. Enter the Raspberry Pi's IP address (e.g. `192.168.1.42`).
4. Click **Connect**.

## Setting Up a Fixed IP (Recommended)

For a stable connection, configure the Raspberry Pi as a **WiFi access point** so it always uses the IP `192.168.4.1`:

```bash
sudo apt install hostapd dnsmasq -y

# /etc/hostapd/hostapd.conf
interface=wlan0
ssid=DroneControl
hw_mode=g
channel=7
wpa_passphrase=dronepass123

# /etc/dnsmasq.conf
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
```

Then connect your laptop/phone to the `DroneControl` WiFi network and use `192.168.4.1` in the webapp.

## Using Real Hardware

1. Open `real_drone.py` and fill in the SDK calls for your drone.
2. In `server.py`, replace:
   ```python
   from stub_drone import StubDrone
   drone = StubDrone()
   ```
   with:
   ```python
   from real_drone import RealDrone
   drone = RealDrone()
   ```
3. Install your hardware SDK (e.g. `pip install djitellopy` for a Tello).

## Server Architecture

```
server.py          WebSocket server — routes JSON messages
drone_interface.py Abstract base class — defines the drone API
stub_drone.py      Software simulation — no hardware needed
real_drone.py      Hardware adapter — fill in your SDK calls
runner.py          Subprocess runner — executes uploaded Python scripts
```

## Message Protocol

See `src/types/websocket-protocol.ts` in the webapp for the full JSON schema.

| Direction        | Type            | Purpose                          |
|-----------------|-----------------|----------------------------------|
| Webapp → RPi    | `ping`          | Test connection                  |
| Webapp → RPi    | `command`       | Single drone action              |
| Webapp → RPi    | `upload`        | Full Python script to execute    |
| Webapp → RPi    | `abort`         | Kill running script              |
| RPi → Webapp    | `pong`          | Connection confirmed             |
| RPi → Webapp    | `telemetry`     | Live data (battery, height, ...) |
| RPi → Webapp    | `status`        | Log / progress messages          |
| RPi → Webapp    | `error`         | Error notification               |
