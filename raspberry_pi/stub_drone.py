"""
Software stub drone — simulates realistic drone behaviour without any hardware.
Used for development and testing when no physical drone is attached.
"""
import time
import threading
from drone_interface import DroneInterface


class StubDrone(DroneInterface):

    def __init__(self):
        self._lock = threading.Lock()
        self._height: float = 0.0
        self._state: str = "idle"
        self._battery: int = 92
        self._speed: float = 0.0
        self._yaw: float = 0.0

        # Slowly drain battery while "flying"
        self._battery_thread = threading.Thread(target=self._drain_battery, daemon=True)
        self._battery_thread.start()

    # ------------------------------------------------------------------
    # DroneInterface implementation
    # ------------------------------------------------------------------

    def takeoff(self) -> None:
        print("[StubDrone] Takeoff")
        with self._lock:
            self._state = "flying"
        # Simulate gradual ascent to 1 m
        steps = 20
        for i in range(steps):
            with self._lock:
                self._height = round((i + 1) / steps, 2)
                self._speed = 0.3
            time.sleep(0.05)
        with self._lock:
            self._speed = 0.0
        print("[StubDrone] Airborne at 1.0 m")

    def land(self) -> None:
        print("[StubDrone] Landing")
        with self._lock:
            self._state = "landing"
            start_height = self._height
        steps = 20
        for i in range(steps):
            with self._lock:
                self._height = round(start_height * (1 - (i + 1) / steps), 2)
                self._speed = 0.2
            time.sleep(0.05)
        with self._lock:
            self._height = 0.0
            self._speed = 0.0
            self._state = "idle"
        print("[StubDrone] Landed")

    def emergency_stop(self) -> None:
        print("[StubDrone] EMERGENCY STOP")
        with self._lock:
            self._height = 0.0
            self._speed = 0.0
            self._state = "idle"

    def move(self, direction: str, duration: float) -> None:
        print(f"[StubDrone] Moving {direction} for {duration}s")
        with self._lock:
            self._speed = 0.5
        time.sleep(max(0.0, duration))
        with self._lock:
            self._speed = 0.0
        print(f"[StubDrone] Done moving {direction}")

    def rotate(self, degrees: float) -> None:
        print(f"[StubDrone] Rotating {degrees}°")
        with self._lock:
            self._yaw = (self._yaw + degrees) % 360
        # Simulate rotation time proportional to angle
        time.sleep(abs(degrees) / 180.0)
        print(f"[StubDrone] Yaw now {self._yaw}°")

    def get_telemetry(self) -> dict:
        with self._lock:
            return {
                "battery": self._battery,
                "height": self._height,
                "speed": self._speed,
                "state": self._state,
                "yaw": round(self._yaw, 1)
            }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _drain_battery(self) -> None:
        """Slowly drain battery while flying to make telemetry realistic."""
        while True:
            time.sleep(30)
            with self._lock:
                if self._state == "flying" and self._battery > 0:
                    self._battery = max(0, self._battery - 1)
