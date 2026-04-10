# Raspberry Pi MSP Serial Bridge

Python WebSocket server that bridges the **Drone Blocks** webapp and an
INAV / Betaflight flight controller (AT32F435) via MSP over UART.

The RPi has **no drone logic** — the browser generates all MSP commands and
the bridge simply relays bytes between the WebSocket and the UART serial port.

---

## Hardware Setup

### Wiring (RPi ↔ AT32F435 FC)

```
Raspberry Pi GPIO    →    AT32F435 FC UART
─────────────────────────────────────────────
GPIO 14 (TX)         →    RX pin
GPIO 15 (RX)         ←    TX pin
GND                  —    GND
```

Use a **logic level shifter** if needed (both RPi and most FCs run at 3.3 V,
so direct connection is usually fine).

### Raspberry Pi UART Setup

Free the primary UART from the serial console:

```bash
sudo raspi-config
# → Interface Options → Serial Port
#   "Login shell over serial?" → NO
#   "Serial port hardware enabled?" → YES
sudo reboot
```

After reboot: `/dev/serial0` (alias for `/dev/ttyAMA0`) is available.

---

## FC Setup (INAV / Betaflight Configurator — one-time)

| Step | Where | Setting |
|------|-------|---------|
| 1 | **Ports** tab | Enable **MSP** on the UART connected to the RPi → baud **115200** |
| 2 | **Configuration** → Receiver | Set receiver type to **"MSP RX (control via MSP port)"** |
| 3 | **Modes** tab | Assign **ANGLE** mode to AUX2 channel range (e.g. 1300–2100) |
| 4 | — | **Save and reboot** the FC |

---

## Software Setup

```bash
# 1. Copy the raspberry_pi/ folder to your RPi
scp -r raspberry_pi/ pi@192.168.4.1:~/drone-server/

# 2. SSH in
ssh pi@192.168.4.1

# 3. Install Python dependencies
cd ~/drone-server
pip install -r requirements.txt
```

---

## Running the Bridge

```bash
python bridge.py
```

The bridge opens `ws://0.0.0.0:8765` and waits for a browser connection.
Once a client connects, it opens `/dev/serial0` at 115200 baud and relays:

- **Browser → FC:** binary WebSocket frames (MSP packets) → UART TX
- **FC → Browser:** UART RX bytes → binary WebSocket frames

---

## Hover Throttle Tuning

Different drone builds hover at different throttle values. Edit the constant
in the webapp source at `src/utils/MSPProtocol.ts`:

```typescript
HOVER_THROTTLE: 1550,   // increase if drone sinks, decrease if it climbs
```

Other tunable values in the same file:

| Constant | Default | Effect |
|----------|---------|--------|
| `MOVE_AMOUNT` | 100 | Pitch/roll deflection for move commands |
| `YAW_AMOUNT` | 150 | Yaw deflection for rotate commands |
| `VERT_AMOUNT` | 80 | Throttle offset for up/down moves |

---

## Fixed IP / WiFi Access Point (Recommended)

For a stable connection, configure the RPi as a WiFi access point at
`192.168.4.1` (the default IP prepopulated in the webapp):

```bash
sudo apt install hostapd dnsmasq -y

# /etc/hostapd/hostapd.conf
interface=wlan0
ssid=DroneControl
hw_mode=g
channel=6
wpa_passphrase=dronepass123
wpa=2
wpa_key_mgmt=WPA-PSK

# /etc/dnsmasq.conf
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h

# /etc/network/interfaces (add)
allow-hotplug wlan0
iface wlan0 inet static
  address 192.168.4.1
  netmask 255.255.255.0
```

---

## File Structure

```
raspberry_pi/
├── bridge.py           WebSocket ↔ UART serial relay (entry point)
├── requirements.txt    Python dependencies
└── README.md           This file
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `[Errno 13] Permission denied: '/dev/serial0'` | `sudo usermod -aG dialout pi` then re-login |
| Bridge opens but FC doesn't respond | Check Ports tab in FC configurator — MSP must be enabled on the correct UART at 115200 |
| FC arms but failsafe triggers immediately | The browser must send `MSP_SET_RAW_RC` at ≥10 Hz. Ensure the webapp is connected and executing |
| No telemetry in the webapp | Check Modes tab — ANGLE mode must be assigned. Check FC is not in failsafe |
| WebSocket connects but bridge crashes | Verify `/dev/serial0` exists after `raspi-config` UART setup and reboot |
| Drone drifts during moves | Tune `MOVE_AMOUNT` / `YAW_AMOUNT` in `MSPProtocol.ts` |
| Drone sinks or climbs at hover | Tune `HOVER_THROTTLE` in `MSPProtocol.ts` |
