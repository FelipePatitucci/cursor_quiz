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


def game_stats(
    anime_selected: str,
    total_guesses: int,
    correct_count: int,
    total_characters: int,
    last_guesses: list[str],
    score: int,
) -> None:
    print(f"\nAnime: '{anime_selected}'")
    print(f"Stats:\nGuesses made: {total_guesses}")
    print(f"Progress: {correct_count}/{total_characters} characters!")
    print(f"Last 5 guesses: {', '.join(last_guesses[-5:])}\n")
    print(f"Score: {score}")


def display_remaining(
    guessed_indices: set[int],
    index_to_names: dict[int, list[str]],
) -> None:
    print("Characters Remaining:\n")
    for idx, infos in index_to_names.items():
        if idx in guessed_indices:
            continue
        print(
            "%s (native: %s) (%s)\n  - Image: %s\n"
            % (
                infos["names"][0].upper(),
                infos["names"][-1],
                infos["role"],
                infos["image"],
            )
        )


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
