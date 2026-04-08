"""
Abstract base class defining the drone hardware interface.
All drone backends (stub, real hardware) must implement this.
"""
from abc import ABC, abstractmethod


class DroneInterface(ABC):

    @abstractmethod
    def takeoff(self) -> None:
        """Command the drone to take off and hover."""

    @abstractmethod
    def land(self) -> None:
        """Command the drone to land."""

    @abstractmethod
    def emergency_stop(self) -> None:
        """Immediately kill all motors."""

    @abstractmethod
    def move(self, direction: str, duration: float) -> None:
        """
        Move in the given direction for the given duration (seconds).
        direction: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down'
        """

    @abstractmethod
    def rotate(self, degrees: float) -> None:
        """
        Rotate by degrees. Positive = clockwise, negative = counter-clockwise.
        """

    def get_telemetry(self) -> dict:
        """
        Return a dict of current drone state.
        Subclasses should override this to return real hardware values.
        """
        return {
            "battery": 100,
            "height": 0.0,
            "speed": 0.0,
            "state": "idle",
            "yaw": 0.0
        }
