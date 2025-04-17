import requests
from dataclasses import dataclass
from typing import List
from config import STRAPI_URL

@dataclass
class User:
    id: int
    username: str
    email: str
    rolle: str

def get_users(jwt: str) -> List[User]:
    url = f"{STRAPI_URL}/users"
    headers = {
        "Authorization": f"Bearer {jwt}"
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Raise an exception for HTTP errors

    users = response.json()
    user_list = [User(id=user['id'], username=user['username'], email=user['email'], rolle=user['rolle']) for user in users]

    return user_list
