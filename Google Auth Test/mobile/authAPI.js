import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from './authStorage';

const API_URL = 'http://localhost:3000';

//holds the generation num + the promise
let accountRequest = null;
//indicates the current user log in session
let authGeneration = 0;

//get authGeneration num
export function getAuthGeneration() {
  return authGeneration;
}

//checks if a requests generation is current
export function isAuthGenerationCurrent(generation) {
  return generation === authGeneration;
}

//upon log out, update the generation id + null current user promise
export function invalidateAuthRequests() {
  authGeneration += 1;
  accountRequest = null;
}

async function refreshSession(generation) {
    //get refresh token from secure storage
  const refreshToken = await getRefreshToken();
  if (!isAuthGenerationCurrent(generation)) {
    return false;
  }

    //if missing, clear all tokens + false
  if (!refreshToken) {
    await clearTokens();
    return false;
  }

  //attempt to refresh session w/ new access token + new refresh token
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!isAuthGenerationCurrent(generation)) {
    return false;
  }

  //issue? -> clear and false
  if (response.status === 401) {
    await clearTokens();
    return false;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Unable to refresh your session.');
  }

  //successful? save access token in RAM + refresh token in secure storage
  if (!isAuthGenerationCurrent(generation)) {
    return false;
  }
  await saveTokens(data);
  return isAuthGenerationCurrent(generation);
}

async function requestCurrentUser(generation) {
    //unable to get access token -> try via refresh token
  if (!getAccessToken()) {
    const restored = await refreshSession(generation);
    //unable to refresh? -> unable to request user -> null
    if (!restored) {
      return null;
    }
  }

  //refresh success -> new access token -> try
  let response = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  if (!isAuthGenerationCurrent(generation)) {
    return null;
  }

  //access token error? -> refresh with refresh token
  if (response.status === 401) {
    const refreshed = await refreshSession(generation);

    //unable to refresh -> sign in needed again -> null (no user)
    if (!refreshed) {
      return null;
    }

    //if access token generated via refresh, try once more
    response = await fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    if (!isAuthGenerationCurrent(generation)) {
      return null;
    }
  }

  //second /me fail? -> we dont want infinite loop of retry so no user (null)
  if (response.status === 401) {
    await clearTokens();
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Unable to load your account.');
  }

  //return user data -> {id:...}
  return data.user;
}

export function loadCurrentUser() {
  const generation = getAuthGeneration();

    //if no user loaded, try to load user
  if (!accountRequest || accountRequest.generation !== generation) {
    //get back promise, return it, then reset to null via finally
    const promise = requestCurrentUser(generation).finally(() => {
      if (accountRequest?.promise === promise) {
        accountRequest = null;
      }
    });

    accountRequest = { generation, promise };
  }

  return accountRequest.promise;
}

export async function revokeSession(refreshToken) {
    //request logout via revokeSession endpoint
    //use refresh token to end session -> no need to validate user here with access token during log out
  const response = await fetch(`${API_URL}/revokeSession`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  //log out error
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Unable to revoke your session.');
  }
}
