import requests
from dataclasses import dataclass
from typing import List
from config import STRAPI_URL

def get_ausnahmen(jwt: str) -> List[dict]:
    url = f"{STRAPI_URL}/ausnahmen"
    headers = {
        "Authorization": f"Bearer {jwt}"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Raise an exception for HTTP errors
    res = response.json()
    data = res['data']
    attributeList = []
    for ausnahme in data:
        attributes = ausnahme['attributes']
        attributeList.append(attributes)
    return attributeList
