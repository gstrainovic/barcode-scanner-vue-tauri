from .base import BaseModel
from peewee import *

class Users(BaseModel):
    strapi_id = IntegerField()
    username = CharField()
    rolle = CharField()
    class Meta:
        table_name = 'users'

