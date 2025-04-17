from backend.req.post_barcode import post_barcode

def send_barcode(barcode, user, jwt, lager_user_ids):
    barcode_c = barcode

    if not jwt:
        notification.notify(
            title="Barcode Scanner",
            message=f"{barcode_c} lokal gespeichert"
        )
        return

    try:
        post_barcode(barcode, user, jwt, lager_user_ids, False)
        notification.notify(
            title="Barcode Scanner",
            message=f"{barcode_c} gesendet"
        )
    except Exception as e:
        print(f"Error: {e}")
        # Hier sollte eine Funktion zum Anzeigen eines Dialogs hinzugefügt werden, z.B.:
        # dialog.alert_default(str(e))
