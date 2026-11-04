class ShieldAuthError(Exception):
    """Base class for ShieldAuth errors."""


class ConfigurationError(ShieldAuthError):
    """The client was set up without something it needs."""
