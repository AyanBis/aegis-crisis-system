import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()


def get_supabase_config_status():
    required_vars = {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_SERVICE_KEY": os.getenv("SUPABASE_SERVICE_KEY"),
    }

    missing = [name for name, value in required_vars.items() if not value]
    return {
        "configured": not missing,
        "missing": missing,
    }


class SupabaseClientProxy:
    def __init__(self):
        self._client: Client | None = None

    def _get_client(self) -> Client:
        status = get_supabase_config_status()
        if not status["configured"]:
            missing = ", ".join(status["missing"])
            raise RuntimeError(
                f"Supabase is not configured. Add these Railway variables: {missing}"
            )

        if self._client is None:
            self._client = create_client(
                os.environ["SUPABASE_URL"],
                os.environ["SUPABASE_SERVICE_KEY"],
            )

        return self._client

    def __getattr__(self, name):
        return getattr(self._get_client(), name)


# Lazy proxy keeps the FastAPI app importable for Railway healthchecks.
supabase = SupabaseClientProxy()
