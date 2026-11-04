from .client import ShieldAuth, canonical_message, verify_signature
from .exceptions import ConfigurationError, ShieldAuthError
from .hwid import get_hwid

__version__ = "2.0.0"
__all__ = [
    "ShieldAuth",
    "ShieldAuthError",
    "ConfigurationError",
    "canonical_message",
    "verify_signature",
    "get_hwid",
]
