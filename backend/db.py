from pymongo import MongoClient
from dotenv import load_dotenv
import os

# .env einlesen
load_dotenv()

# Connection String aus Umgebungsvariable
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI ist nicht gesetzt (fehlende .env?)")

# MongoDB-Client erstellen (Singleton für das ganze Backend)
client = MongoClient(MONGO_URI)

# Konkrete Datenbank auswählen (Name kannst du anpassen)
db = client["it_merch_shop"]

def get_db():
    """Gibt die ausgewählte Datenbank zurück."""
    return db

def ping():
    """Testet die Verbindung zur MongoDB."""
    return client.admin.command("ping")
