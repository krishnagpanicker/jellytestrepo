import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

import {
  clearTokens,
  getRefreshToken,
  saveTokens,
} from './authStorage';
import {
  getAuthGeneration,
  invalidateAuthRequests,
  isAuthGenerationCurrent,
  loadCurrentUser,
  revokeSession,
} from './authAPI';
import styles from './styles';

GoogleSignin.configure({
  webClientId:
    '664527151770-pensouckkscgrd5bskuh90pooipn2inq.apps.googleusercontent.com',
  iosClientId:
    '664527151770-aaa0ub64s2o0m6vn5qmbrco095tedpd2.apps.googleusercontent.com',
});

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startupError, setStartupError] = useState(null);
  const [startupAttempt, setStartupAttempt] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  //isloading render
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.signInText}>
          Checking your session…
        </Text>
      </View>
    );
  }

  //error render
  if (startupError) {
    return (
      <View style={styles.container}>
        <View style={styles.signInCard}>
          <Text style={styles.title}>Unable to connect</Text>
          <Text style={styles.signInText}>{startupError}</Text>

          <Pressable
            style={styles.googleButton}
            onPress={() => {
              setIsLoading(true);
              setStartupAttempt(attempt => attempt + 1);
            }}
          >
            <Text style={styles.googleButtonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  //dummy user render
  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.signInCard}>
          <Text style={styles.title}>Welcome to Jelly</Text>
          <Text style={styles.signInText}>
            Your Jelly user ID is {user.id}
          </Text>
          <Pressable
            style={styles.googleButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Text style={styles.googleButtonText}>
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  //app render
  return (
    <View style={styles.container}>
      <View style={styles.signInCard}>
        <Text style={styles.title}>Jelly Auth Practice</Text>
        <Text style={styles.signInText}>
          Sign in to continue
        </Text>

        <Pressable
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={isSigningIn}
        >
          <Text style={styles.googleButtonText}>
            {isSigningIn ? 'Signing in…' : 'Log in with Google'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
