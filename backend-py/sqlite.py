from models.history import History
from models.users import Users
from models.einstellungen import Einstellungen
from models.ausnahmen import Ausnahmen
from models.leitcodes import Leitcodes
from req.get_users import get_users
from req.get_settings import get_settings
from req.get_ausnahmen import get_ausnahmen
from req.get_leitcodes import get_leitcodes

class Sqlite:
    def sync(self, jwt):
        self.sync_users(jwt)
        self.sync_settings(jwt)
        self.sync_ausnahmen(jwt)
        self.sync_leitcodes(jwt)
        return

    def getHistory(self):
        json = []
        for entry in History.select().dicts().order_by(History.timestamp.desc()).limit(5):
            entry['timestamp'] = entry['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
            json.append(entry)
        return json

    def saveHistory(self, status, barcode, user_id, offline, lager_user_ids):
        status = History.create(status=status, barcode=barcode, user_id=user_id, offline=offline, lager_user_ids=lager_user_ids)
        return

    def updateHistory(self, idi):
        History.update(synced=True).where(History.id == idi).execute()
        return

    def get_sync_history(self):
        json = []
        for entry in History.select().dicts().where(History.synced == False).where(History.offline == True).where(History.status == 'OK'):
            entry['timestamp'] = entry['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
            json.append(entry)
        return json

    def sync_users(self, jwt):
        Users.delete().execute()
        users = get_users(jwt)
        for user in users:
            Users.create(strapi_id=user.id, username=user.username, rolle=user.rolle)
        return

    def get_user(self, username):
        user = Users.select().where(Users.username == username).dicts().first()
        return user

    def get_lager_users(self):
        json = []
        for entry in Users.select().dicts().where(Users.rolle == 'Lager'):
            json.append(entry)
        return json

    def get_settings(self):
        settings = Einstellungen.select().dicts().first()
        settings = {
            'Barcode_Mindestlaenge': settings['barcode_mindestlaenge'],
            'Leitcodes_Aktiv': settings['leitcodes_aktiv'],
            'Ausnahmen_Aktiv': settings['ausnahmen_aktiv'],
        }
        return settings

    def sync_settings(self, jwt):
        Einstellungen.delete().execute()
        settings = get_settings(jwt)
        Einstellungen.create(
            barcode_mindestlaenge=settings['Barcode_Mindestlaenge'],
            leitcodes_aktiv=settings['Leitcodes_Aktiv'],
            ausnahmen_aktiv=settings['Ausnahmen_Aktiv']
        )
        return

    def sync_ausnahmen(self, jwt):
        Ausnahmen.delete().execute()
        ausnahmen = get_ausnahmen(jwt)
        for ausnahme in ausnahmen:
            Ausnahmen.create(barcode=ausnahme['Barcode'], bedeutung=ausnahme['Bedeutung'])
        return

    def get_ausnahmen(self):
        json = []
        for entry in Ausnahmen.select().dicts():
            json.append(entry)
        return json

    def sync_leitcodes(self, jwt):
        Leitcodes.delete().execute()
        leitcodes = get_leitcodes(jwt)
        for leitcode in leitcodes:
            temp = leitcode['Leitcode_Buchstabe']
            lc_buchstabe = self.get_leitcode_buchstabe(temp)
            Leitcodes.create(beschreibung=leitcode['Beschreibung'], mindeslaenge=leitcode['Mindeslaenge'], leitcode_buchstabe=lc_buchstabe)
        return

    def get_leitcode_buchstabe(self, leitcodes_req_data):
        data = leitcodes_req_data['data']
        leitcode_buchstabe = []
        for buchstabe in data:
            attributes = buchstabe['attributes']
            buchstabe = attributes['Buchstabe']
            position = attributes['Position_Null_Beginnend']
            leitcode_buchstabe.append(f"{buchstabe}:{position}")

        return ";".join(leitcode_buchstabe)

    def get_leitcodes_sql():
        leitcodes_rec = Leitcodes.select().execute()

        leitcodes = []

        for leitcode in leitcodes_rec:
            leitcode_buchstabe_ar = leitcode.leitcode_buchstabe.split(";")

            leitcode_buchstabe = []

            for buchstabe in leitcode_buchstabe_ar:
                buchstabe_ar = buchstabe.split(":")

                if len(buchstabe_ar) == 2:
                    buchstabe_obj = {
                        'Buchstabe': buchstabe_ar[0],
                        'Position_Null_Beginnend': int(buchstabe_ar[1])
                    }

                    leitcode_buchstabe.append(buchstabe_obj)

            id_atr_buchstaben = [
                {
                    'id': i,
                    'attributes': buchstabe
                }
                for i, buchstabe in enumerate(leitcode_buchstabe)
            ]

            leitcode_obj = {
                'Beschreibung': leitcode.beschreibung,
                'Mindeslaenge': leitcode.mindeslaenge,
                'Leitcode_Buchstabe': {
                    'data': id_atr_buchstaben
                }
            }

            leitcodes.append(leitcode_obj)

        id_atr = [
            {
                'id': i,
                'attributes': leitcode
            }
            for i, leitcode in enumerate(leitcodes)
        ]

        return id_atr
