class ShieldAuthError(Exception):
    """Base exception for ShieldAuth"""
    pass

class ValidationError(ShieldAuthError):
    """License validation failed"""
    pass

class InitializationError(ShieldAuthError):
    """ShieldAuth not initialized"""
    pass