"""
ScriptRunner — executes uploaded Python flight programs in a subprocess.
Streams stdout line-by-line via a callback and supports abort().
"""
import os
import sys
import subprocess
import tempfile
import threading
from typing import Callable, Optional


class ScriptRunner:

    def __init__(self):
        self._process: Optional[subprocess.Popen] = None
        self._thread: Optional[threading.Thread] = None
        self._temp_path: Optional[str] = None

    def run(
        self,
        code: str,
        on_output: Optional[Callable[[str], None]] = None,
        on_done: Optional[Callable[[], None]] = None
    ) -> None:
        """
        Execute `code` in a subprocess.
        Calls on_output(line) for each line of stdout/stderr.
        Calls on_done() when the process exits.
        Any previously running script is aborted first.
        """
        self.abort()

        # Write code to a temp file
        with tempfile.NamedTemporaryFile(
            mode='w', suffix='.py', delete=False, encoding='utf-8'
        ) as f:
            f.write(code)
            self._temp_path = f.name

        def _run_in_thread():
            try:
                self._process = subprocess.Popen(
                    [sys.executable, self._temp_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1  # line-buffered
                )
                if self._process.stdout:
                    for line in self._process.stdout:
                        stripped = line.rstrip()
                        if stripped and on_output:
                            on_output(stripped)
                self._process.wait()
            except Exception as exc:
                if on_output:
                    on_output(f"[Runner error] {exc}")
            finally:
                self._cleanup_temp()
                if on_done:
                    on_done()

        self._thread = threading.Thread(target=_run_in_thread, daemon=True)
        self._thread.start()

    def abort(self) -> None:
        """Terminate the running script, if any."""
        if self._process and self._process.poll() is None:
            self._process.terminate()
            try:
                self._process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self._process.kill()
        self._process = None
        self._cleanup_temp()

    def _cleanup_temp(self) -> None:
        if self._temp_path and os.path.exists(self._temp_path):
            try:
                os.unlink(self._temp_path)
            except OSError:
                pass
        self._temp_path = None
