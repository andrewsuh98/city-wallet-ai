import json
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY", "")
CITY_CONFIG_NAME = os.getenv("CITY_CONFIG", "nyc")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./city_wallet.db")


def load_city_config() -> dict:
    config_path = BASE_DIR / "city_configs" / f"{CITY_CONFIG_NAME}.json"
    with open(config_path) as f:
        return json.load(f)


city_config = load_city_config()
