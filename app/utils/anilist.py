import json
from pathlib import Path
from time import sleep
from typing import Any, Callable, Optional

import requests

from app.utils.configs import characters_path, users_path
from app.utils.queries import (
    query_animes_from_user,
    query_characters_from_anime,
    query_user_info,
)
from app.utils.utils import (
    ensure_dir_exists,
    read_from_cache,
    today_date_string,
)

URL = "https://graphql.anilist.co"


def return_json(res: requests.Response) -> dict[str, Any]:
    return res.json()


def get_data(
    url: str,
    query: str,
    variables: dict[str, Any],
    max_retries: int = 3,
    timeout: int = 15,
    wait_time: int = 5,
    process_fn: Optional[Callable[[requests.Response], Any]] = None,
) -> requests.Response | Any:
    attempts = 0
    completed = False
    wait = False

    for attempts in range(max_retries):
        if wait:
            sleep(wait_time)
        try:
            res = requests.post(
                URL,
                json={"query": query, "variables": variables},
                timeout=timeout,
            )
            completed = res.ok
            if completed:
                break

            if 400 <= res.status_code < 500:
                raise ValueError(f"Received '{res.reason}' as a response.")

            # lets try again but now waiting a little (useful when the server may be overloaded)
            wait = True
            attempts += 1
            wait_time *= attempts
            print(
                f"Received '{res.reason}' for link {url}. Trying again after {wait_time}s."
            )

        except TimeoutError:
            print(f"Timeout during url {url} request. (attempt: {attempts + 1})")

        except Exception as e:
            print(str(e))
            print(f"Failed to request data from link {url}. (attempt: {attempts + 1})")

    if not completed:
        print(f"Failed to get response from url {url} after {max_retries} attempts.")
        raise TimeoutError

    elif process_fn is not None:
        res = process_fn(res)

    return res


def get_infos_from_user(username: str) -> dict[str, str]:
    variables = {"userName": username}
    res = get_data(URL, query_user_info, variables, process_fn=return_json)

    return res["data"]


def get_animes_from_user(username: str, chunk_size: int = 200) -> dict[str, str]:
    # from here we can get some metadata such as user_id, avatar, options and statistics
    user_info = get_data(
        URL, query_user_info, {"userName": username}, process_fn=return_json
    )
    user_data = {
        "user": user_info["data"]["User"],
        "animeList": {
            "allStatus": [],
        },
        "last_updated": today_date_string(),
    }

    user_id = user_data["user"]["id"]
    filepath = Path(f"{users_path}{user_id}.json").resolve()

    # reading from "cache"
    if filepath.exists():
        cache_result = read_from_cache(filepath=filepath)
        if cache_result:
            # still fresh enough
            return cache_result

    variables = {"userName": username, "chunk": 1, "perChunk": chunk_size}

    while True:
        res = get_data(URL, query_animes_from_user, variables, process_fn=return_json)
        data = res["data"]["MediaListCollection"]

        for item in data["lists"]:
            status = item["status"].lower()

            if status in user_data["animeList"]["allStatus"]:
                user_data["animeList"][status] += item["entries"]
            else:
                user_data["animeList"]["allStatus"].append(status)
                user_data["animeList"][status] = item["entries"]

        if not data["hasNextChunk"]:
            break

        variables["chunk"] += 1

    ensure_dir_exists(users_path)
    # caching data
    print("Caching info...")
    with open(file=filepath, mode="w+", encoding="utf-8") as f:
        json.dump(user_data, f, indent=4)

    return user_data


def get_characters_from_anime(anime_id: int = 12189) -> dict[str, str]:
    variables = {"animeId": anime_id, "page": 1}
    final_data = []

    # reading from "cache" (possibly early return)
    filepath = Path(f"{characters_path}{anime_id}.json").resolve()
    if filepath.exists():
        cache_result = read_from_cache(filepath=filepath)
        if cache_result:
            # still fresh enough
            return cache_result

    while True:
        res = get_data(
            URL, query_characters_from_anime, variables, process_fn=return_json
        )
        data = res["data"]["Media"]["characters"]["edges"]

        for item in data:
            info = item["node"]
            entry = {
                "id": info["id"],
                "name": info["name"],
                "image": info["image"]["large"],
                "gender": info["gender"],
                "favourites": info["favourites"],
                "role": item["role"],
            }
            final_data.append(entry)

        if not res["data"]["Media"]["characters"]["pageInfo"]["hasNextPage"]:
            break

        variables["page"] += 1

    ensure_dir_exists(characters_path)

    character_data = {
        "data": final_data,
        "last_updated": today_date_string(),
    }

    # caching data
    with open(file=filepath, mode="w+", encoding="utf-8") as f:
        json.dump(character_data, f, indent=4)

    return character_data


def prepare_for_game_anilist(
    anime_id: int = 12189, favourite_cut: int = 5
) -> tuple[dict[str, int], dict[int, list[str]]]:
    """
    Prepares character data for a game by mapping character names to their indices and vice versa.

    Args:
        anime_id (int): The id of the anime for which to prepare character data. Defaults to 12189 ("Hyouka").
        favourite_cut (int): The minimum amount of favourites a character must have to enter the game. Defaults to 5.
            This is done to prevent characters that appears 1 time in the show and thus are almost impossible to remember.

    Returns:
        tuple[dict[str, int], dict[int, list[str]]]: A tuple containing two dictionaries:
            - The first dictionary maps different versions of character names (e.g., "first last", "last first", etc.) to character indices.
            - The second dictionary maps character indices to a list of possible name variations.

    Notes:
        - The function retrieves all character data for the specified anime and processes their names, including first name, last name, native name, and alternative versions.
        - Each character can have multiple name representations, which are stored in the resulting dictionaries.
        - Last name (family name) is removed to avoid collisions.
    """
    res = get_characters_from_anime(anime_id=anime_id)["data"]
    map_char_and_names = {}
    map_index_to_infos = {}

    for idx, char in enumerate(res):
        names = char.get("name", {})

        if not names:
            print(f"No names found for character {char}")
            continue

        print(names)
        fn = names["first"] if names["first"] is not None else ""
        ln = names["last"] if names["last"] is not None else ""
        native = names["native"].replace(" ", "") if names["native"] is not None else ""
        alternatives = names["alternative"]

        # applying cut
        if char["favourites"] < favourite_cut and char["role"] != "MAIN":
            continue

        # either first, last, native or first + last are correct
        # this approach may cause problems because many characters can have
        all_names = [ln + " " + fn, fn + " " + ln, fn] + alternatives + [native]
        all_names = [name.strip().lower() for name in all_names if name]
        map_index_to_infos[idx] = {
            "names": all_names,
            "gender": char["gender"],
            "favourites": char["favourites"],
            "role": char["role"],
            "image": char["image"],
        }

        for option in all_names:
            map_char_and_names[option] = idx

    return map_char_and_names, map_index_to_infos
