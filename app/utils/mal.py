"""
Obsolete module. May be used in the future, but probably won't.
"""

import requests


ANIME_ENDPOINT = "https://api.jikan.moe/v4/anime/"


def get_mal_characters(anime_id: int = 12189, timeout: float = 1.5) -> list[dict]:
    try:
        url = f"{ANIME_ENDPOINT}{anime_id}/characters"
        r = requests.get(url=url, timeout=timeout).json()["data"]
        print(f"Successfully retrieved characters from anime id: {anime_id}.\n")
        return r
    except Exception:
        print(f"Failed to retrieve characters from anime id: {anime_id}. Skipping!\n")
        return [dict()]


def prepare_for_game_mal(
    anime_id: int = 12189,
) -> tuple[dict[str, int], dict[int, list[str]]]:
    """
    Prepares character data for a game by mapping character names to their indices and vice versa.

    Args:
        anime_id (int): The id of the anime for which to prepare character data. Defaults to 12189 ("Hyouka").

    Returns:
        tuple[dict[str, int], dict[int, list[str]]]: A tuple containing two dictionaries:
            - The first dictionary maps different versions of character names (e.g., "first last", "last first", etc.) to character indices.
            - The second dictionary maps character indices to a list of possible name variations.

    Notes:
        - The function retrieves all character data for the specified anime and processes their names, including first name, last name, native name, and alternative versions.
        - Each character can have multiple name representations, which are stored in the resulting dictionaries.
        - Last name (family name) is removed to avoid collisions.
    """
    res = get_mal_characters(anime_id=anime_id)
    map_char_and_names = {}
    map_index_to_names = {}

    for idx, char in enumerate(res):
        # this is FamilyName GivenName (Uzumaki Naruto)
        name = char["character"]["name"].replace(",", "")
        img = char["character"]["images"]["jpg"]["image_url"]

        # either given name, native or first + last are correct
        all_names = [name, " ".join(name.split(" ").reverse()), name.split(" ")[-1]]
        all_names = [name.strip() for name in all_names if name]
        map_index_to_names[idx] = all_names

        for option in all_names:
            map_char_and_names[option] = idx

    return map_char_and_names, map_index_to_names
