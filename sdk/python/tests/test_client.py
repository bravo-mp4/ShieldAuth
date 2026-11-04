import base64
import json
import os
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, utils

from shieldauth import ConfigurationError, ShieldAuth, canonical_message, verify_signature

HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, "..", "..", "test-vectors.json"), encoding="utf-8") as handle:
    VECTORS = json.load(handle)


def sign(key, text):
    r, s = utils.decode_dss_signature(key.sign(text.encode(), ec.ECDSA(hashes.SHA256())))
    return base64.b64encode(r.to_bytes(32, "big") + s.to_bytes(32, "big")).decode()


class SharedVectorTests(unittest.TestCase):
    def test_signed_text_matches_server(self):
        v = VECTORS["validate"]
        text = canonical_message("validate", [
            v["app_id"], v["license_key"], v["hwid"], v["nonce"], 1 if v["valid"] else 0,
            v["session_id"], v["expires_at"], v["signed_at"],
        ])
        self.assertEqual(text, v["message"])

    def test_verifies_server_signatures_and_rejects_tampering(self):
        for v in (VECTORS["validate"], VECTORS["heartbeat"]):
            self.assertTrue(verify_signature(VECTORS["public_key_pem"], v["message"], v["signature"]))
            self.assertFalse(verify_signature(VECTORS["public_key_pem"], v["message"] + "x", v["signature"]))


class FakeServer:
    """Signs like the real API, or misbehaves like a fake one."""

    def __init__(self):
        self.key = ec.generate_private_key(ec.SECP256R1())
        self.attacker = ec.generate_private_key(ec.SECP256R1())
        self.mode = "honest"
        self.valid = True
        self.heartbeat_valid = True
        fake = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                signed_at = int(time.time()) - (3600 if fake.mode == "stale" else 0)
                nonce = "some-other-nonce-value" if fake.mode == "wrong-nonce" else body["nonce"]
                key = fake.attacker if fake.mode == "forged-key" else fake.key
                status = 200
                if self.path == "/validate":
                    session = "s" * 64 if fake.valid else None
                    text = canonical_message("validate", [
                        body["app_id"], body["license_key"], body["hwid"], body["nonce"],
                        1 if fake.valid else 0, session, None, signed_at,
                    ])
                    answer = {"valid": fake.valid, "message": "ok", "session_id": session}
                else:
                    text = canonical_message("heartbeat", [
                        body["session_id"], body["nonce"], 1 if fake.heartbeat_valid else 0, signed_at,
                    ])
                    answer = {"valid": fake.heartbeat_valid, "message": "hb"}
                    status = 200 if fake.heartbeat_valid else 401
                answer.update({"nonce": nonce, "signed_at": signed_at, "signature": sign(key, text)})
                if fake.mode == "unsigned":
                    del answer["signature"]
                data = json.dumps(answer).encode()
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

        self.httpd = HTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        self.url = f"http://127.0.0.1:{self.httpd.server_port}"
        self.public_pem = self.key.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode()


class ClientTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = FakeServer()

    @classmethod
    def tearDownClass(cls):
        cls.server.httpd.shutdown()
        cls.server.httpd.server_close()

    def setUp(self):
        self.server.mode, self.server.valid, self.server.heartbeat_valid = "honest", True, True
        self.client = ShieldAuth("app", self.server.url, self.server.public_pem, hwid="machine")

    def test_accepts_genuine_answer(self):
        self.assertTrue(self.client.validate("KEY"))
        self.assertEqual(self.client.session_id, "s" * 64)

    def test_rejects_untrustworthy_valid_answers(self):
        for mode in ("forged-key", "wrong-nonce", "stale", "unsigned"):
            with self.subTest(mode=mode):
                self.server.mode = mode
                self.assertFalse(self.client.validate("KEY"))

    def test_unreachable_server_is_not_licensed(self):
        offline = ShieldAuth("app", "http://127.0.0.1:1", allow_unsigned=True, timeout=0.5)
        self.assertFalse(offline.validate("KEY"))

    def test_heartbeat_revocation_calls_handler(self):
        self.assertTrue(self.client.validate("KEY"))
        self.assertTrue(self.client.heartbeat())
        self.server.heartbeat_valid = False
        self.server.valid = False
        revoked = threading.Event()
        self.client.start_heartbeat(interval=0.05, on_invalid=lambda reason: revoked.set())
        self.assertTrue(revoked.wait(5))
        self.assertFalse(self.client.is_valid())

    def test_requires_public_key(self):
        with self.assertRaises(ConfigurationError):
            ShieldAuth("app", self.server.url)


if __name__ == "__main__":
    unittest.main()
