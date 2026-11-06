import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

import {
  clearTokens,
  getRefreshToken,
  saveTokens,
} from '../authStorage';

import {
  createUserProfile,
  getAuthGeneration,
  invalidateAuthRequests,
  isAuthGenerationCurrent,
  loadCurrentUser,
  revokeSession,
  updateUserProfile,
} from '../authAPI';

GoogleSignin.configure({
  webClientId:
    '664527151770-pensouckkscgrd5bskuh90pooipn2inq.apps.googleusercontent.com',
  iosClientId:
    '664527151770-aaa0ub64s2o0m6vn5qmbrco095tedpd2.apps.googleusercontent.com',
});

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startupError, setStartupError] = useState(null);
  const [startupAttempt, setStartupAttempt] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    //ignore prevents old async requests from updating our state vars (comp unmounting/remounting)
    let ignore = false;

    //try to load user upon startup
    async function restoreSession() {
      const generation = getAuthGeneration();
      //loading state true while we try to retrieve user
      setIsLoading(true);
      setStartupError(null);

      try {
        //try to get current user id
        const currentUser = await loadCurrentUser();

        if (!ignore && isAuthGenerationCurrent(generation)) {
          setUser(currentUser);
        }
      }
      //return any error
      catch (error) {
        if (!ignore) {
          setStartupError(error.message);
        }
      }
      //update loading state
      finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    //clean up function to reset ignore for new startupAttepmts
    return () => {
      ignore = true;
    };
  }, [startupAttempt]);

  async function handleGoogleSignIn() {
    if (isSigningIn) {
      return;
    }

    setIsSigningIn(true);
    const generation = getAuthGeneration();

    try {
      const signInResponse = await GoogleSignin.signIn();

      if (!isSuccessResponse(signInResponse)) {
        return;
      }

      const { idToken } = signInResponse.data;

      if (!idToken) {
        throw new Error('Google did not return an ID token.');
      }

      const response = await fetch(
        'http://localhost:3000/auth/google',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to sign in.');
      }

      if (!isAuthGenerationCurrent(generation)) {
        return;
      }

      await saveTokens(data);

      if (!isAuthGenerationCurrent(generation)) {
        return;
      }

      const currentUser = await loadCurrentUser();

      if (!currentUser) {
        throw new Error('Please sign in again.');
      }

      if (isAuthGenerationCurrent(generation)) {
        setUser(currentUser);
      }
    } catch (error) {
      if (isAuthGenerationCurrent(generation)) {
        Alert.alert('Sign-In Failed', error.message);
      }
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleLogout() {
    //prevent another logout attempt while awaiting
    if (isLoggingOut) {
      return;
    }

    //invalidate any past refresh attemps after logout
    setIsLoggingOut(true);
    setIsSavingProfile(false);
    setProfileError(null);
    invalidateAuthRequests();

    //set up promises
    let revocationRequest = Promise.resolve();
    let revocationReadError = null;

    try {
      //get refresh token to revoke session
      const refreshToken = await getRefreshToken();

      if (refreshToken) {
        //await revokeSession promise, saving it revocationRequest
        revocationRequest = revokeSession(refreshToken);
      }
    } 
    catch (error) {
      revocationReadError = error;
    }

    //clear all tokens for this session
    //holds clearTokens response
    const clearingTokens = clearTokens();
    setUser(null);

    //wait until all promises return values
    //these promisese w/out await allow these to run in parrallel
    //at the end, we wait for both to return
    const [clearResult, revocationResult] = await Promise.allSettled([
      clearingTokens,
      revocationRequest,
    ]);

    //log out complete -> update state
    setIsLoggingOut(false);

    //any return errors -> show alerts
    if (clearResult.status === 'rejected') {
      Alert.alert(
        'Logout Incomplete',
        'Your user state was cleared, but the saved tokens could not be removed from this phone.'
      );
    } 
    else if (
      revocationReadError ||
      revocationResult.status === 'rejected'
    ) 
    {
      Alert.alert(
        'Logged Out Locally',
        'Your tokens and user state were cleared, but backend session revocation was not confirmed.'
      );
    }
  }

  function retryStartup() {
    setIsLoading(true);
    setStartupAttempt(attempt => attempt + 1);
  }

  //run upon username submition
  async function handleCreateUsername(username) {
    //guard state to prevent multiple username saves simultaniously
    if (isSavingProfile) {
      return;
    } 

    //request generation id
    const generation = getAuthGeneration();
    //currently saving profile -> no error
    setIsSavingProfile(true);
    setProfileError(null);

    try {
      //await authAPI handler to successfully create and store user info
      //returns user object -> user_id, username, avatar_color
      const profile = await createUserProfile(username);

      //ensure current log-in before updating state
      if (isAuthGenerationCurrent(generation)) {
        setUser(currentUser => ({
          ...currentUser,
          ...profile,
        }));
      }
    }
    //errors must only be sent if current log in
    catch (error) {
      if (isAuthGenerationCurrent(generation)) {
        setProfileError(error.message);
      }
    }
    //ends isSaving state (if current generation)
    finally {
      if (isAuthGenerationCurrent(generation)) {
        setIsSavingProfile(false);
      }
    }
  }

  async function handleUpdateProfile({ username, avatarColor }) {
    if (isSavingProfile) {
      return false;
    }

    const generation = getAuthGeneration();
    setIsSavingProfile(true);
    setProfileError(null);

    try {
      const profile = await updateUserProfile({ username, avatarColor });

      if (!isAuthGenerationCurrent(generation)) {
        return false;
      }

      setUser(currentUser => ({
        ...currentUser,
        username: profile.username,
        avatarColor: profile.avatarColor,
      }));
      return true;
    }
    catch (error) {
      if (isAuthGenerationCurrent(generation)) {
        setProfileError(error.message);
      }
      return false;
    }
    finally {
      if (isAuthGenerationCurrent(generation)) {
        setIsSavingProfile(false);
      }
    }
  }

  function clearProfileError() {
    setProfileError(null);
  }

  return {
    user,
    isLoading,
    startupError,
    isSigningIn,
    isLoggingOut,
    isSavingProfile,
    profileError,
    handleGoogleSignIn,
    handleLogout,
    handleCreateUsername,
    handleUpdateProfile,
    clearProfileError,
    retryStartup,
  };
}
