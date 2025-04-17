import requests
from dataclasses import dataclass
from typing import Optional
from config import STRAPI_URL

def get_settings(jwt: str) -> Optional[dict]:
    url = f"{STRAPI_URL}/einstellung"
    headers = {
        "Authorization": f"Bearer {jwt}"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Raise an exception for HTTP errors
    res = response.json()
    data = res['data']
    attributes = data['attributes']
    return attributes



