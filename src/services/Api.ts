import { resonateUrl } from "../constants";

const API = `${resonateUrl}api/`;
export const oidcStorage = `oidc.user:https://id.resonate.coop:${process.env.REACT_APP_CLIENT_ID}`;

class NotFoundError extends Error {
  constructor(params: any) {
    super(params);
    Object.setPrototypeOf(this, NotFoundError.prototype);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }

    this.message = "Not Found";
  }
}

export const getToken = (apiVersion?: string | number) => {
  let token: string | undefined = undefined;
  try {
    const stateString = localStorage.getItem("state");
    const state = JSON.parse(stateString ?? "");
    token = state?.token;
  } catch (e) {}

  let version = apiVersion ?? "v3";

  try {
    const oauthStateString = localStorage.getItem(oidcStorage);
    const oauthState = JSON.parse(oauthStateString ?? "");
    token = oauthState.access_token;
    version = apiVersion ?? "v3";
  } catch (e) {}
  return { token: token, version };
};

const fetchWrapper = async (
  url: string,
  options: RequestInit,
  apiOptions?: APIOptions,
  pagination?: boolean
) => {
  const { token, version: apiVersion } = getToken(apiOptions?.apiVersion);
  let fullUrl = `${API}${apiVersion}/${url}`;
  if (apiOptions && options.method === "GET") {
    const params = new URLSearchParams();
    Object.keys(apiOptions).forEach((key) => {
      params.set(key, `${apiOptions[key]}`);
    });
    fullUrl += `?${params}`;
  }

  return fetch(fullUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
    .then((result) => {
      if (!result.ok) {
        if (result.status === 404) {
          throw new NotFoundError(result);
        }
      } else {
        // go the desired response
      }
      return result.json();
    })
    .then((result) => {
      if (pagination) {
        return result;
      }
      return result.data;
    });
};

export const fetchUserProfile = async (): Promise<LoggedInUser> => {
  return fetchWrapper("user/profile/", {
    method: "GET",
  });
};

export const fetchUserPlaylists = async (
  id: number,
  options?: APIOptions
): Promise<Trackgroup[]> => {
  return fetchWrapper(
    `users/${id}/playlists`,
    {
      method: "GET",
    },
    options
  );
};

interface FetchTrackGroupFilter extends APIOptions {
  type?: TrackgroupType;
}

// FIXME: What's the difference between fetching a user's playlists
// (as with the staff picks) and fetching the user's trackgroups.
// Also note that if you don't supply a type, then the listing returns
// 0. That might be an API error?
export const fetchUserTrackGroups = async (
  options?: FetchTrackGroupFilter
): Promise<TrackgroupDetail[]> => {
  return fetchWrapper(
    `user/trackgroups`,
    {
      method: "GET",
    },
    options
  );
};

export const fetchTrackGroups = async (
  options?: FetchTrackGroupFilter
): Promise<APIPaginatedResult<Trackgroup>> => {
  return fetchWrapper(
    "trackgroups",
    {
      method: "GET",
    },
    options,
    true
  );
};

export const fetchTrackGroup = async (
  id: string
): Promise<TrackgroupDetail> => {
  return fetchWrapper(`trackgroups/${id}`, {
    method: "GET",
  });
};

/**
 * User track groups
 */

export const createTrackGroup = async (data: {
  cover: string;
  title: string;
  type: string;
}): Promise<TrackgroupDetail> => {
  return fetchWrapper(`user/trackgroups`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateTrackGroup = async (
  id: string,
  data: {
    cover: string;
    title: string;
    private: boolean;
    tags: string[];
    type: string;
    about?: string;
  }
): Promise<TrackgroupDetail> => {
  return fetchWrapper(`user/trackgroups/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const fetchUserTrackGroup = async (
  id: string
): Promise<TrackgroupDetail> => {
  return fetchWrapper(`user/trackgroups/${id}`, {
    method: "GET",
  });
};

export const addTracksToTrackGroup = async (
  id: string,
  data: {
    tracks: { track_id: number }[];
  }
) => {
  return fetchWrapper(`user/trackgroups/${id}/items/add`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const removeTracksFromTrackGroup = async (
  id: string,
  data: {
    tracks: { track_id: number }[];
  }
) => {
  return fetchWrapper(`user/trackgroups/${id}/items/remove`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const setNewTracksOnTrackGroup = async (
  id: string,
  data: {
    tracks: { track_id: number; index?: number }[];
  }
) => {
  return fetchWrapper(`user/trackgroups/${id}/items`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteUserTrackGroup = async (id: string) => {
  return fetchWrapper(`user/trackgroups/${id}`, {
    method: "DELETE",
  });
};

export const uploadTrackGroupCover = async (file: File) => {
  var data = new FormData();
  const { token } = getToken();
  data.append("file", file);
  return fetch("https://dash.resonate.coop/api/user/upload", {
    method: "POST",
    body: data,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

/**
 * Misc user info
 */

export const fetchUserStats = async (
  from: string,
  to: string
): Promise<Stat[]> => {
  return fetchWrapper(`user/plays/stats?from=${from}&to=${to}`, {
    method: "GET",
  });
};

export const fetchUserArtistHistory = async (
  options?: APIOptions
): Promise<APIPaginatedResult<{ uid: number; meta_value: string }>> => {
  return fetchWrapper(
    "user/plays/history/artists",
    { method: "GET" },
    options,
    true
  );
};

export const fetchUserCollection = async (
  options?: APIOptions
): Promise<APIPaginatedResult<Track>> => {
  return fetchWrapper("user/collection/", { method: "GET" }, options, true);
};

export const fetchUserHistory = async (
  options?: APIOptions
): Promise<APIPaginatedResult<Track>> => {
  return fetchWrapper("user/plays/history/", { method: "GET" }, options, true);
};

export const fetchUserFavorites = async (
  options?: APIOptions
): Promise<APIPaginatedResult<Track>> => {
  return fetchWrapper(
    "user/favorites",
    {
      method: "GET",
    },
    options,
    true
  );
};

export const addTrackToUserFavorites = async (id: number): Promise<Track[]> => {
  return fetchWrapper("user/favorites", {
    method: "POST",
    body: JSON.stringify({
      track_id: id,
    }),
  });
};

export const checkTrackIdsForFavorite = async (
  ids: number[]
): Promise<{ track_id: number }[]> => {
  return fetchWrapper("user/favorites/resolve", {
    method: "POST",
    body: JSON.stringify({
      ids,
    }),
  });
};

interface TagOptions extends APIOptions {
  tag: string;
}

export const fetchByTag = async ({
  tag,
  ...options
}: TagOptions): Promise<APIPaginatedResult<TagResult>> => {
  return fetchWrapper(
    `tag/${tag}`,
    {
      method: "GET",
    },
    options,
    true
  );
};
/**
 *  Label endpoints
 */

export const fetchLabels = (
  options?: APIOptions
): Promise<APIPaginatedResult<Label>> => {
  return fetchWrapper(`labels`, { method: "GET" }, options, true);
};

export const fetchLabel = (labelId: number): Promise<Label> => {
  return fetchWrapper(`labels/${labelId}`, {
    method: "GET",
  });
};

export const fetchLabelReleases = (labelId: number): Promise<Release[]> => {
  return fetchWrapper(`labels/${labelId}/releases`, {
    method: "GET",
  });
};

export const fetchLabelArtists = (labelId: number): Promise<LabelArtist[]> => {
  return fetchWrapper(`labels/${labelId}/artists`, {
    method: "GET",
  });
};

export const fetchLabelAlbums = (labelId: number): Promise<LabelAlbum[]> => {
  return fetchWrapper(`labels/${labelId}/albums`, {
    method: "GET",
  });
};

/**
 * Artist endpoints
 */

export const fetchArtists = (
  options?: APIOptions
): Promise<APIPaginatedResult<Artist>> => {
  return fetchWrapper(
    `artists`,
    {
      method: "GET",
    },
    options,
    true
  );
};

export const fetchArtist = (artistId: number): Promise<Artist> => {
  return fetchWrapper(`artists/${artistId}`, {
    method: "GET",
  });
};

export const fetchArtistReleases = (artistId: number): Promise<Release[]> => {
  return fetchWrapper(`artists/${artistId}/releases`, {
    method: "GET",
  });
};

export const fetchArtistTopTracks = (artistId: number): Promise<Track[]> => {
  return fetchWrapper(`artists/${artistId}/tracks/top`, {
    method: "GET",
  });
};

/**
 * Track endpoints
 */

export const fetchLatestTracks = (
  options: APIOptions
): Promise<APIPaginatedResult<Track>> => {
  return fetchWrapper(
    `tracks/${options.order !== "random" ? "latest" : ""}`,
    {
      method: "GET",
    },
    options,
    true
  ).then((results) => {
    return { ...results, data: results.data.map((r: Track) => ({ ...r })) };
  });
};

export const fetchTrack = (trackId: number): Promise<Track> => {
  return fetchWrapper(`tracks/${trackId}`, {
    method: "GET",
  });
};

export const registerPlay = (
  trackId: number
): Promise<{ count: number; cost: number; total: string }> => {
  return fetchWrapper(`user/plays`, {
    method: "POST",
    body: JSON.stringify({ track_id: trackId }),
  });
};

export const buyTrack = async (trackId: number) => {
  return fetchWrapper(`user/plays/buy`, {
    method: "POST",
    body: JSON.stringify({
      track_id: trackId,
    }),
  });
};

export const checkPlayCountOfTrackIds = async (
  ids: number[]
): Promise<{ track_id: number; count: number }[]> => {
  return fetchWrapper("user/plays/resolve", {
    method: "POST",
    body: JSON.stringify({
      ids,
    }),
  });
};

/**
 *  Search endpoints
 */

export const fetchSearchResults = (
  searchString: string
): Promise<SearchResult[] | null> => {
  return fetchWrapper(
    "search/",
    { method: "GET" },
    // NOTE: API is looking for actual "+" (%2B) values instead of whitespace (%20)
    { q: searchString.replace(/ /g, "+") }
  );
};
