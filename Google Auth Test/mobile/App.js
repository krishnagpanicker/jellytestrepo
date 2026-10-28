import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '664527151770-pensouckkscgrd5bskuh90pooipn2inq.apps.googleusercontent.com',
  iosClientId: '664527151770-aaa0ub64s2o0m6vn5qmbrco095tedpd2.apps.googleusercontent.com',
});

import styles from './styles';

export default function App() {
  async function handleGoogleSignIn() {
    try {
      /** Android feature
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      */
      const signInResponse = await GoogleSignin.signIn();

      if (!isSuccessResponse(signInResponse)) {
        return;
      }

      const { idToken } = signInResponse.data;

      if (!idToken) {
        throw new Error('Google did not return an ID token.');
      }

      const response = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      console.log('Google sign-in successful:', data);
    }
    catch (error) {
      Alert.alert('Google Sign-In Failed', error.message);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.signInCard}>
        <Text style={styles.title}>Jelly Auth Practice</Text>
        <Text style={styles.signInText}>Sign in to continue</Text>

        <Pressable style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Text style={styles.googleButtonText}>Log in with Google</Text>
        </Pressable>
      </View>
    </View>
  );
}
