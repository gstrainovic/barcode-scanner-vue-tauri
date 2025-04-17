class Status:
    WARN = "Warn"
    ERROR = "Error"
    OK = "Ok"

class Type:
    AUSNAHME = "Ausnahme"
    ZU_KURZ = "ZuKurz"
    DHL_LEITCODE = "DhlLeitcode"
    BEREITS_GESENDET = "BereitsGesendet"
    KEINE_NUMMERN = "KeineNummern"
    OK = "Ok"

class Error:
    def __init__(self, message, status, error_type):
        self.message = message
        self.status = status
        self.error_type = error_type

def ausnahme(x):
    return Error(
        message=f"@C03{x}",
        status=Status.WARN,
        error_type=Type.AUSNAHME
    )

def zu_kurz():
    return Error(
        message="@C88Zu kurz",
        status=Status.ERROR,
        error_type=Type.ZU_KURZ
    )

def leitcode(x):
    return Error(
        message=f"@C88{x} Leitcode",
        status=Status.ERROR,
        error_type=Type.DHL_LEITCODE
    )

def bereits_gesendet():
    return Error(
        message="@C88Bereits gesendet",
        status=Status.ERROR,
        error_type=Type.BEREITS_GESENDET
    )

def ok():
    return Error(
        message="OK",
        status=Status.OK,
        error_type=Type.OK
    )

def no_numbers():
    return Error(
        message="@C03Barcode seltsam",
        status=Status.WARN,
        error_type=Type.KEINE_NUMMERN
    )
