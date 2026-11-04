"""ShieldAuth client: license validation with signed answers and heartbeats.

See sdk/PROTOCOL.md for what is sent and what is signed.
"""

import base64
import json
import secrets
import threading
import time
import urllib.error
import urllib.request
from typing import Callable, List, Optional, Union

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, utils

from .exceptions import ConfigurationError
from .hwid import get_hwid

SIGNATURE_VERSION = "shieldauth-v1"


def canonical_message(kind: str, fields: List[Union[str, int, None]]) -> str:
    """The text the server signs: fixed fields joined with newlines."""
    return "\n".join([SIGNATURE_VERSION, kind] + ["" if f is None else str(f) for f in fields])


def verify_signature(public_key_pem: Union[str, ec.EllipticCurvePublicKey], message: str, signature_b64: str) -> bool:
    """Checks a base64 IEEE P1363 (r || s) ECDSA P-256 signature."""
    try:
        key = (
            serialization.load_pem_public_key(public_key_pem.encode())
            if isinstance(public_key_pem, str)
            else public_key_pem
        )
        raw = base64.b64decode(signature_b64)
        if len(raw) != 64:
            return False
        der = utils.encode_dss_signature(int.from_bytes(raw[:32], "big"), int.from_bytes(raw[32:], "big"))
        key.verify(der, message.encode("utf-8"), ec.ECDSA(hashes.SHA256()))
        return True
    except (InvalidSignature, ValueError, TypeError):
        return False


class ShieldAuth:
    """
    shield = ShieldAuth(APP_ID, api_url="https://host/api/v1", public_key=PEM)
    if not shield.validate(license_key):
        sys.exit("Not licensed")
    shield.start_heartbeat()
    """

    def __init__(
        self,
        app_id: str,
        api_url: str,
        public_key: Optional[str] = None,
        *,
        allow_unsigned: bool = False,
        timeout: float = 10.0,
        hwid: Optional[str] = None,
        max_clock_skew: int = 300,
    ):
        if not app_id:
            raise ConfigurationError("app_id is required")
        if not api_url:
            raise ConfigurationError("api_url is required")
        if not public_key and not allow_unsigned:
            raise ConfigurationError("public_key is required (or pass allow_unsigned=True for local testing)")

        self.app_id = app_id
        self.api_url = api_url.rstrip("/")
        self.public_key = serialization.load_pem_public_key(public_key.encode()) if public_key else None
        self.allow_unsigned = allow_unsigned
        self.timeout = timeout
        self.hwid = hwid or get_hwid()
        self.max_clock_skew = max_clock_skew
        self.session_id: Optional[str] = None
        self.last_message = ""
        self._valid = False
        self._license_key: Optional[str] = None
        self._heartbeat_stop: Optional[threading.Event] = None

    def validate(self, license_key: str) -> bool:
        """True if the license is valid. Never raises; network errors count as not valid."""
        self._license_key = license_key
        nonce = secrets.token_urlsafe(18)
        body = self._post("/validate", {
            "app_id": self.app_id, "license_key": license_key, "hwid": self.hwid, "nonce": nonce,
        })
        if body is None:
            return self._fail("Couldn't reach the license server")

        message = canonical_message("validate", [
            self.app_id, license_key, self.hwid, nonce, 1 if body.get("valid") is True else 0,
            body.get("session_id"), body.get("expires_at"), body.get("signed_at"),
        ])
        if not self._trusted(body, nonce, message):
            return self._fail("License server answer failed verification")

        self._valid = body.get("valid") is True
        self.session_id = body.get("session_id") if self._valid else None
        self.last_message = body.get("message", "")
        return self._valid

    def heartbeat(self) -> bool:
        """Renews the session. False once revoked or lapsed; also False (but still valid) when offline."""
        if not self.session_id:
            return False
        session_id = self.session_id
        nonce = secrets.token_urlsafe(18)
        body = self._post("/heartbeat", {"session_id": session_id, "nonce": nonce})
        if body is None:
            return False

        valid = body.get("valid") is True
        message = canonical_message("heartbeat", [session_id, nonce, 1 if valid else 0, body.get("signed_at")])
        if not self._trusted(body, nonce, message):
            return False
        if not valid:
            self._valid = False
            self.session_id = None
        self.last_message = body.get("message", "")
        return valid

    def start_heartbeat(self, interval: float = 300, on_invalid: Optional[Callable[[str], None]] = None) -> None:
        """Heartbeats on a background thread; calls on_invalid (default: exit) once the license is gone."""
        self.stop_heartbeat()
        stop = threading.Event()
        self._heartbeat_stop = stop

        def default_handler(reason: str) -> None:
            import os
            print(f"ShieldAuth: {reason}")
            os._exit(1)  # sys.exit only ends this thread

        handler = on_invalid or default_handler

        def loop() -> None:
            while not stop.wait(interval):
                self.heartbeat()
                # A session that lapsed (sleep, long outage) gets one fresh validation first.
                if not self._valid and self._license_key:
                    self.validate(self._license_key)
                if not self._valid:
                    stop.set()
                    handler(self.last_message or "License is no longer valid")

        threading.Thread(target=loop, name="shieldauth-heartbeat", daemon=True).start()

    def stop_heartbeat(self) -> None:
        if self._heartbeat_stop:
            self._heartbeat_stop.set()
        self._heartbeat_stop = None

    def is_valid(self) -> bool:
        return self._valid

    def _fail(self, message: str) -> bool:
        self._valid = False
        self.session_id = None
        self.last_message = message
        return False

    def _trusted(self, body: dict, nonce: str, message: str) -> bool:
        if self.allow_unsigned and self.public_key is None:
            return True
        signed_at = body.get("signed_at")
        if not self.public_key or not body.get("signature") or body.get("nonce") != nonce or not isinstance(signed_at, int):
            return False
        if abs(time.time() - signed_at) > self.max_clock_skew:
            return False
        return verify_signature(self.public_key, message, body["signature"])

    def _post(self, path: str, payload: dict) -> Optional[dict]:
        request = urllib.request.Request(
            self.api_url + path,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "shieldauth-python/2.0"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                return json.loads(response.read())
        except urllib.error.HTTPError as error:
            # 401 from /heartbeat still carries a signed verdict.
            try:
                return json.loads(error.read()) if error.code == 401 else None
            except ValueError:
                return None
            finally:
                error.close()
        except (urllib.error.URLError, OSError, ValueError):
            return None
