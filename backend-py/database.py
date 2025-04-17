from peewee import SqliteDatabase
from os import path

pfad = 'db.sqlite'
db = SqliteDatabase(pfad)

def initialize_database():
    if not path.exists(pfad):
        db.connect()
        from models.ausnahmen import Ausnahmen
        db.create_tables([Ausnahmen])

        from models.einstellungen import Einstellungen
        db.create_tables([Einstellungen])

        from models.history import History
        db.create_tables([History])

        from models.leitcodes import Leitcodes
        db.create_tables([Leitcodes])

        from models.users import Users
        db.create_tables([Users])
    else:
        db.connect()
