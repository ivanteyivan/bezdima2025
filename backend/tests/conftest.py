import os
import pytest

from services.cloud_auth import CloudRuAuthenticator
from services.compute_client import ComputeAPI


def _env_set() -> bool:
    return all(
        os.getenv(var)
        for var in ["CLOUD_KEY_ID", "CLOUD_SECRET", "CLOUD_PROJECT_ID"]
    )


skip_env = pytest.mark.skipif(not _env_set(), reason="Cloud credentials not set")


@pytest.fixture(scope="session")
def project_id() -> str:
    return os.environ["CLOUD_PROJECT_ID"]


@pytest.fixture(scope="session")
@skip_env
def auth() -> CloudRuAuthenticator:
    return CloudRuAuthenticator()


@pytest.fixture(scope="session")
@skip_env
def compute(project_id: str, auth: CloudRuAuthenticator) -> ComputeAPI:
    return ComputeAPI(authenticator=auth, project_id=project_id)

