query_characters_from_anime = """
query ($animeId: Int!, $page: Int!) {
  Media (id: $animeId){
    characters(sort:FAVOURITES_DESC, page: $page, perPage: 25) {
      edges {
        node {
          id
          name {
            first
            last
            native
            alternative
          }
          image {
            large
          }
          gender
          age
          favourites
        }
        role
      },
      pageInfo {
        hasNextPage
      }
    }
  }
}
"""
query_animes_from_user = """
query ($userName: String!, $chunk: Int!, $perChunk: Int!) {
  MediaListCollection (
    userName: $userName,
    type: ANIME,
    sort: SCORE_DESC,
    chunk: $chunk,
    perChunk: $perChunk,
    status_not: PLANNING
  ) {
    lists {
      status,
      entries {
        score(format: POINT_10_DECIMAL),
        progress,
        private,
        completedAt {
          year
          month
        },
        media {
          id,
          title {
            romaji,
            english,
            native
          },
          status,
          episodes,
          coverImage {
            large
          },
          bannerImage
        }
      }
    },
    hasNextChunk
  }
}
"""
query_user_info = """
query ($userName: String!) {
  User (name: $userName) {
    id,
    name,
    about,
    avatar {
      large
    },
    options {
      titleLanguage
    },
    statistics {
      anime {
        count,
        meanScore,
        episodesWatched
      }
    }
  }
}
"""
