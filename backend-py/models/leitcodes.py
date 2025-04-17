from .base import BaseModel
from peewee import *

class Leitcodes(BaseModel):
    id = AutoField()
    beschreibung = TextField()
    mindeslaenge = IntegerField()
    leitcode_buchstabe = TextField()
    class Meta:
        table_name = 'leitcodes'
