from req.post_barcode import post_barcode
from req.check_duplicate_barcode import is_barcode_duplicate
from sqlite import Sqlite

def sync_history(jwt):
    history_to_sync = Sqlite.get_sync_history()
    for history in history_to_sync:
        lager_user_ids = [int(s) for s in history['lager_user_ids'].split(",") if s.isdigit()]

        if is_barcode_duplicate(jwt, history['barcode'], history['user_id']):
            Sqlite.update_history(history['id'])
            continue

        try:
            post_barcode(
                history['barcode'],
                history['user_id'],
                jwt,
                lager_user_ids,
                True,
            )
            Sqlite.update_history(history['id'])
        except Exception as e:
            print(f"Error: {e}")
