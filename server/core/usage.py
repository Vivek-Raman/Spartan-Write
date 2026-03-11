import os

from workos.types.user_management import User
from core.agent import AgentCreds


def validate_and_fetch_creds(user: User):
    if not user:
        raise ValueError("User is required to fetch credentials")

    # TODO: Check usage limits for the user

    return AgentCreds(
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        openai_api_base=os.getenv("OPENAI_API_BASE"),
        openai_api_model=os.getenv("OPENAI_API_MODEL"),
    )
