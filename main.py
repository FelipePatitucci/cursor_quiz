import random
import sys
from time import time

from lib.anilist import prepare_for_game_anilist, get_animes_from_user
from lib.utils import display_remaining, game_stats


scores = {"MAIN": 3, "SUPPORTING": 1}


def main(favourite_cut: int = 5) -> None:
    print("Welcome to the Anime Character Guessing Game!")

    # TODO: later write this on a file to avoid prompting this
    username = input("Enter your username on anilist to start: ").strip()
    username = username or "Febonebo"

    print("Getting user data...")
    user_list = get_animes_from_user(username=username)
    user_preferred_language = user_list["user"]["options"]["titleLanguage"].lower()
    includes = []

    # TODO: when transitioning to streamlit, this should be a dropdown and should include other filters
    # such genres, score, year completed and so on.
    for status in user_list["animeList"]["allStatus"]:
        answer = input(
            f"The game should consider animes with status '{status}' from your list (Y or N)?"
        )
        if answer.lower() == "y":
            includes += user_list["animeList"].get(status, [])

    if not includes:
        print("No animes found. Exiting...")
        sys.exit()

    print(f"Found {len(includes)} animes to play. Selecting a random one...")
    selected_entry = random.choice(includes)
    anime_id = selected_entry["media"]["id"]
    anime_name = selected_entry["media"]["title"][user_preferred_language]

    # Get the character name mappings
    map_char_and_names, map_index_to_infos = prepare_for_game_anilist(
        anime_id=anime_id, favourite_cut=favourite_cut
    )
    total_characters = len(map_index_to_infos)

    # Initialize game state
    guessed_indices = set()
    total_guesses = 0
    total_score = 0
    last_guesses = []

    print(f"The selected anime is {anime_name}! Good luck!")
    start = time()

    while True:
        if len(guessed_indices) == total_characters:
            print("Congratulations! You have guessed all the characters!")
            game_stats(
                anime_name,
                total_guesses,
                len(guessed_indices),
                total_characters,
                last_guesses,
                total_score,
            )
            et = time()
            print(f"Total time: {round(et - start)}s.")
            break

        # Get user's guess
        user_input = (
            input("Guess a character name (or type 'stats' or 'quit'): ")
            .strip()
            .lower()
        )

        # Handle custom commands
        if user_input.lower() == "stats":
            game_stats(
                anime_name,
                total_guesses,
                len(guessed_indices),
                total_characters,
                last_guesses,
                total_score,
            )
            continue

        elif user_input.lower() == "quit":
            print("\nThanks for playing!")
            game_stats(
                anime_name,
                total_guesses,
                len(guessed_indices),
                total_characters,
                last_guesses,
                total_score,
            )
            display_remaining(guessed_indices, map_index_to_infos)
            et = time()
            print(f"Total time: {round(et - start)}s.")
            sys.exit()

        # Process the guess
        total_guesses += 1
        last_guesses.append(user_input)

        if user_input in map_char_and_names:
            # Correct guess
            idx = map_char_and_names[user_input]
            if idx not in guessed_indices:
                entry = map_index_to_infos[idx]
                total_score += scores[entry["role"]]
                guessed_indices.add(idx)

                # Remove all variations for the guessed character
                for name in map_index_to_infos[idx]:
                    map_char_and_names.pop(name, None)

                print(f"Correct! {entry['names'][0]} (native: {entry['names'][-1]})")
                print(
                    f"You have guessed {len(guessed_indices)} out of {total_characters} characters."
                )

            else:
                print("You already guessed this character. Try again.\n")
        else:
            print("Incorrect guess. Try again.\n")


main(favourite_cut=5)
