import json
from datetime import datetime
from pathlib import Path
from typing import Any

from app.utils.configs import cache_ttl


def ensure_dir_exists(directory_path: str) -> None:
    """
    Ensures that the specified directory exists.

    Args:
        directory_path (str): The path to the directory.
    """
    directory = Path(directory_path)
    if not directory.exists():
        directory.mkdir(parents=True, exist_ok=True)
        print(f"Directory '{directory_path}' created.")


def today_date_string() -> str:
    """
    Returns the current date in the format YYYY-MM-DD.

    Returns:
        str: The current date in the format YYYY-MM-DD.
    """
    return datetime.today().date().strftime("%Y-%m-%d")


def calculate_freshness(str_date: str) -> int:
    """
    Calculates the number of days between today and the given date string.

    Args:
        str_date (str): The date string in the format "YYYY-MM-DD".

    Returns:
        int: The number of days between today and the given date.
    """
    return (
        datetime.today().date() - datetime.strptime(str_date, "%Y-%m-%d").date()
    ).days


def read_from_cache(filepath: str) -> dict[str, Any]:
    """
    Reads data from a cache file.

    Args:
        filepath (str): The path to the cache file.

    Returns:
        dict[str, Any]]: The data read from the cache file. If the cache is invalid,
            returns an empty dictionary.
    """
    with open(file=filepath, mode="r+", encoding="utf-8") as f:
        data = json.load(f)
        freshness = calculate_freshness(data["last_updated"])

        if freshness < cache_ttl:
            print("Reading from cache...")
            return data

        print(f"Cache invalid (older than {cache_ttl} days). Querying fresh data.")
        return {}
