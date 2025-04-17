from .base import BaseModel
from peewee import *

class Einstellungen(BaseModel):
    id = AutoField()
    barcode_mindestlaenge = IntegerField()
    leitcodes_aktiv = BooleanField()
    ausnahmen_aktiv = BooleanField()
    class Meta:
        table_name = 'einstellungen'

