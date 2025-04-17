import requests
from dataclasses import dataclass
from typing import List
from config import STRAPI_URL

@dataclass
class Attributes:
    createdAt: str

@dataclass
class Data:
    id: int
    attributes: Attributes

@dataclass
class Response:
    data: List[Data]


def is_barcode_duplicate(jwt: str, barcode: str, user_id: int) -> bool:
    url = f"{STRAPI_URL}/barcodes?filters[barcode][$eq]={barcode}&filters[users_permissions_user][id][$eq]={user_id}&sort=createdAt:DESC"
    headers = {
        "Authorization": f"Bearer {jwt}"
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    res = response.json()

    response_data = Response(data=[Data(id=item['id'], attributes=Attributes(createdAt=item['attributes']['createdAt'])) for item in res['data']])

    if len(response_data.data) > 0:
        return True
    else:
        return False



