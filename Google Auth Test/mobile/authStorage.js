import * as SecureStore from 'expo-secure-store';

//label in secure storage to access refresh token
const REFRESH_TOKEN_KEY = 'jelly.refreshToken';

let accessToken = null;
let tokenStorageOperation = Promise.resolve();

function queueTokenStorageOperation(operation) {
  const result = tokenStorageOperation.then(operation, operation);
  tokenStorageOperation = result.catch(() => {});
  return result;
}

//save refresh token in secure storage and access token in memory
export async function saveTokens(tokens) {
    //check tokens are valid
    if (typeof tokens.accessToken !== 'string' || typeof tokens.refreshToken !== 'string') {
        throw new Error('The backend did not return valid tokens.');
    }

  return queueTokenStorageOperation(async () => {
    //refresh token in secure storage
    await SecureStore.setItemAsync(
      REFRESH_TOKEN_KEY,
      tokens.refreshToken
    );

    accessToken = tokens.accessToken;
  });
}

//get functions
export function getAccessToken() {
  return accessToken;
}
export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens(){
  return queueTokenStorageOperation(async () => {
    accessToken = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  });
}
