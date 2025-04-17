from peewee import *
from datetime import datetime
from .base import BaseModel

def isBarcodeInHistory(barcode: str) -> bool:
    return History.select().where(History.barcode == barcode).exists()

class History(BaseModel):
    id = AutoField()
    status = CharField()
    barcode = CharField()
    timestamp = DateTimeField(default=datetime.now)
    synced = BooleanField(default=False)
    user_id = IntegerField(default=0)
    offline = BooleanField(default=False)
    lager_user_ids = TextField(default='')

    class Meta:
        table_name = 'history'
