import requests
from dataclasses import dataclass
from typing import List
from config import STRAPI_URL

def get_leitcodes(jwt: str) -> List:
    url = f"{STRAPI_URL}/leitcodes?populate=*"
    headers = {
        "Authorization": f"Bearer {jwt}"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Raise an exception for HTTP errors
    res = response.json()
    data = res['data']
    attributesList = []
    for leitcode in data:
        attributes = leitcode['attributes']
        attributesList.append(attributes)
    return attributesList
