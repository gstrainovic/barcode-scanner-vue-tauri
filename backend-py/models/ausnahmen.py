from .base import BaseModel
from peewee import *

class Ausnahmen(BaseModel):
    id = AutoField()
    barcode = CharField()
    bedeutung = CharField()
    class Meta:
        table_name = 'ausnahmen'
