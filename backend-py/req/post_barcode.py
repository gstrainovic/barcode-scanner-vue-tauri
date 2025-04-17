import requests
import json
from config import STRAPI_URL

class IdAtr:
    def __init__(self, id, attributes):
        self.id = id
        self.attributes = attributes

class BarcodeData:
    def __init__(self, data):
        self.data = data

def post_barcode(barcode, user, jwt, lager_user_ids, sync):
    url = f"{STRAPI_URL}/barcodes"
    headers = {
        "Authorization": f"Bearer {jwt}",
        "Content-Type": "application/json"
    }
    payload = {
        "data": {
            "barcode": barcode,
            "users_permissions_user": user,
            "lager_mitarbeiter": lager_user_ids,
            "synched": sync
        }
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))

    if response.status_code != 200:
        response.raise_for_status()

    body = response.json()
    return BarcodeData(IdAtr(body['data']['id'], body['data']['attributes']))
