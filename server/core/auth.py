import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from fastapi import Request
from workos import WorkOSClient
from workos.exceptions import AuthenticationException, BaseRequestException
from workos.types.user_management import User


@dataclass
class AuthenticatedSession:
    user_id: str
    user: User


class AuthError(Exception):

    def __init__(self, detail: str, status_code: int = 401):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


@lru_cache(maxsize=1)
def _get_workos_client() -> WorkOSClient:
    api_key = os.getenv("WORKOS_API_KEY")
    client_id = os.getenv("WORKOS_CLIENT_ID")
    if not api_key or not client_id:
        raise AuthError(
            "WorkOS is not configured. Set WORKOS_API_KEY and WORKOS_CLIENT_ID.",
            status_code=500,
        )
    return WorkOSClient(api_key=api_key, client_id=client_id)


def _extract_bearer_token(request: Request) -> str:
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AuthError(
            "Missing or invalid Authorization header. Expected Bearer token.",
            status_code=401,
        )
    return token


def authenticate_request(request: Request) -> AuthenticatedSession:
    refresh_token = _extract_bearer_token(request)
    try:
        response = _get_workos_client(
        ).user_management.authenticate_with_refresh_token(
            refresh_token=refresh_token,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
        )
    except AuthenticationException as exc:
        raise AuthError("Authentication failed.", status_code=401) from exc
    except BaseRequestException as exc:
        raise AuthError(f"Authentication service error: {str(exc)}",
                        status_code=502) from exc

    user = response.user
    return AuthenticatedSession(
        user_id=user.id,
        user=user,
    )
