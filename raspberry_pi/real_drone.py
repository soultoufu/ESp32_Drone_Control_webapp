"""
Real hardware drone adapter.

Fill in the methods below with calls to your specific drone SDK or GPIO library.
Common options:
  - DJI Tello:    pip install djitellopy
  - ArduPilot:    pip install dronekit
  - Custom GPIO:  import RPi.GPIO / pigpio

Swap StubDrone for RealDrone in server.py once hardware is ready.
"""
from drone_interface import DroneInterface


class RealDrone(DroneInterface):

    def __init__(self):
        # Example (Tello):
        #   from djitellopy import Tello
        #   self._tello = Tello()
        #   self._tello.connect()
        #   self._tello.streamon()
        raise NotImplementedError(
            "RealDrone is not configured yet. "
            "Edit real_drone.py with your hardware SDK calls."
        )

    def takeoff(self) -> None:
        # self._tello.takeoff()
        raise NotImplementedError

    def land(self) -> None:
        # self._tello.land()
        raise NotImplementedError

    def emergency_stop(self) -> None:
        # self._tello.emergency()
        raise NotImplementedError

    def move(self, direction: str, duration: float) -> None:
        # Map direction strings to SDK calls, e.g.:
        #   speed_cm_s = 30
        #   distance_cm = int(speed_cm_s * duration)
        #   if direction == 'forward':  self._tello.move_forward(distance_cm)
        #   elif direction == 'backward': self._tello.move_back(distance_cm)
        #   elif direction == 'left':   self._tello.move_left(distance_cm)
        #   elif direction == 'right':  self._tello.move_right(distance_cm)
        #   elif direction == 'up':     self._tello.move_up(distance_cm)
        #   elif direction == 'down':   self._tello.move_down(distance_cm)
        raise NotImplementedError

    def rotate(self, degrees: float) -> None:
        # if degrees >= 0:
        #     self._tello.rotate_clockwise(int(degrees))
        # else:
        #     self._tello.rotate_counter_clockwise(int(-degrees))
        raise NotImplementedError

    def get_telemetry(self) -> dict:
        # return {
        #     "battery": self._tello.get_battery(),
        #     "height":  self._tello.get_height() / 100.0,  # cm → m
        #     "speed":   self._tello.get_speed_x() / 100.0,
        #     "state":   "flying",
        #     "yaw":     self._tello.get_yaw(),
        # }
        raise NotImplementedError
