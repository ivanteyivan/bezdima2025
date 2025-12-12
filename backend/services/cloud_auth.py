import json
import os
import time
from typing import Optional, Dict, Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class CloudRuAuthenticator:
    """
    IAM аутентификация для Evolution Compute Public API v3.
    Получает и кеширует bearer-токен, обновляет при 401 или истечении срока.
    """

    def __init__(
        self,
        key_id: Optional[str] = None,
        secret: Optional[str] = None,
        token_url: str = "https://iam.api.cloud.ru/api/v1/auth/token",
        token_file: Optional[str] = None,
        session: Optional[requests.Session] = None,
    ) -> None:
        self.key_id = key_id or os.getenv("CLOUD_KEY_ID") or os.getenv("CLOUD_RU_KEY_ID")
        self.secret = secret or os.getenv("CLOUD_SECRET") or os.getenv("CLOUD_RU_SECRET")
        self.token_url = token_url
        self.token_file = token_file or os.getenv("CLOUD_TOKEN_FILE") or ".cloud_token.json"
        self.session = session or self._make_session()
        self._token: Optional[Dict[str, Any]] = None
        self._load_token()

        if not self.key_id or not self.secret:
            raise ValueError("Не заданы CLOUD_KEY_ID / CLOUD_SECRET для аутентификации.")

    def _make_session(self) -> requests.Session:
        sess = requests.Session()
        retry_strategy = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
        adapter = HTTPAdapter(max_retries=retry_strategy)
        sess.mount("https://", adapter)
        sess.mount("http://", adapter)
        return sess

    def _save_token(self) -> None:
        try:
            with open(self.token_file, "w", encoding="utf-8") as f:
                json.dump(self._token, f)
        except Exception:
            # В проде лучше логировать, здесь — тихий фолбэк
            pass

    def _load_token(self) -> None:
        try:
            with open(self.token_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                self._token = data
        except Exception:
            self._token = None

    def _fetch_token(self) -> Dict[str, Any]:
        payload = {"keyId": self.key_id, "secret": self.secret}
        resp = self.session.post(self.token_url, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        # expires_in секунд, закладываем сдвиг на 60 секунд
        data["expires_at"] = time.time() + data.get("expires_in", 3600) - 60
        self._token = data
        self._save_token()
        return data

    @property
    def access_token(self) -> str:
        if not self._token or time.time() >= self._token.get("expires_at", 0):
            self._fetch_token()
        return self._token["access_token"]

    def get_headers(self, extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        headers = {"Authorization": f"Bearer {self.access_token}"}
        if extra:
            headers.update(extra)
        return headers

    def ensure_fresh(self) -> None:
        if not self._token or time.time() >= self._token.get("expires_at", 0):
            self._fetch_token()


class CloudRuComputeClient:
    """
    Клиент для Evolution Compute Public API v3.
    Использует CloudRuAuthenticator для автоматического продления токена.
    """

    def __init__(
        self,
        authenticator: CloudRuAuthenticator,
        base_url: str = "https://compute.api.cloud.ru",
        project_id: Optional[str] = None,
    ) -> None:
        self.auth = authenticator
        self.base_url = base_url.rstrip("/")
        self.project_id = project_id or os.getenv("CLOUD_PROJECT_ID")
        self.session = authenticator.session

    def _full_url(self, path: str) -> str:
        if not path.startswith("/"):
            path = "/" + path
        return f"{self.base_url}{path}"

    def request(self, method: str, path: str, **kwargs) -> requests.Response:
        url = self._full_url(path)
        params = kwargs.pop("params", {}) or {}
        if self.project_id and "project_id" not in params:
            params["project_id"] = self.project_id

        def do_request() -> requests.Response:
            self.auth.ensure_fresh()
            headers = kwargs.pop("headers", {}) or {}
            headers = self.auth.get_headers(headers)
            resp = self.session.request(method.upper(), url, params=params, headers=headers, timeout=30, **kwargs)
            return resp

        resp = do_request()
        if resp.status_code == 401:
            # обновляем токен и повторяем
            self.auth._fetch_token()
            resp = do_request()
        resp.raise_for_status()
        return resp

    # Удобные шорткаты
    def get(self, path: str, **kwargs) -> requests.Response:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs) -> requests.Response:
        return self.request("POST", path, **kwargs)

    def delete(self, path: str, **kwargs) -> requests.Response:
        return self.request("DELETE", path, **kwargs)

    def patch(self, path: str, **kwargs) -> requests.Response:
        return self.request("PATCH", path, **kwargs)

