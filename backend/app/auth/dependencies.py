from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database import users_collection
from app.auth.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Reads the Bearer token, verifies its signature, and loads the user.

    We re-fetch the user from the database rather than trusting the token
    payload alone - so if an account is deactivated, its existing tokens
    stop working immediately instead of staying valid until expiry.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = await users_collection.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="This account has been deactivated")

    user["id"] = str(user["_id"])
    return user


def require_role(*allowed_roles: str):
    """
    Route guard factory. Usage:
        @router.post("", dependencies=[Depends(require_role("admin"))])

    Returns a dependency that 403s if the logged-in user's role
    isn't in the allowed list.
    """
    async def role_checker(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these roles: {', '.join(allowed_roles)}",
            )
        return user

    return role_checker


# Convenience guards for the two common cases
require_staff = require_role("admin", "invoicing_user")
require_admin = require_role("admin")