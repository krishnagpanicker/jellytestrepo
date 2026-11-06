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

async function authenticatedRequest(path, options, generation) {
    //unable to get access token -> try via refresh token
  if (!getAccessToken()) {
    const restored = await refreshSession(generation);
    //unable to refresh? -> unable to make request -> null
    if (!restored) {
      return null;
    }
  }

  function sendRequest() {
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });
  }

  //access token available -> try request
  let response = await sendRequest();

  if (!isAuthGenerationCurrent(generation)) {
    return null;
  }

  //access token error? -> refresh with refresh token
  if (response.status === 401) {
    const refreshed = await refreshSession(generation);

    if (!refreshed) {
      return null;
    }

    response = await sendRequest();

    if (!isAuthGenerationCurrent(generation)) {
      return null;
    }
  }

  //second authentication failure -> sign in again
  if (response.status === 401) {
    await clearTokens();
    return null;
  }

  return response;
}

async function requestCurrentUser(generation) {
  const response = await authenticatedRequest(
    '/me',
    { headers: {} },
    generation
  );

  if (!response) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Unable to load your account.');
  }

  return data.user;
}

export async function createUserProfile(username) {
  //request generation id
  const generation = getAuthGeneration();
  //http request to profile endpoint -> providing username entered by user
  const response = await authenticatedRequest(
    '/me/profile',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    },
    generation
  );

  //error
  if (!response) {
    throw new Error('Please sign in again.');
  }

  const data = await response.json();

  //error
  if (!response.ok) {
    const error = new Error(data.error || 'Unable to save your profile.');
    error.code = data.code;
    throw error;
  }

  //return user object request (user_id, username, avatar color)
  return data.user;
}

export async function updateUserProfile({ username, avatarColor }) {
  const generation = getAuthGeneration();
  const response = await authenticatedRequest(
    '/me/profile',
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, avatarColor }),
    },
    generation
  );

  if (!response) {
    throw new Error('Please sign in again.');
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Unable to save your profile.');
    error.code = data.code;
    throw error;
  }

  return data.profile;
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
