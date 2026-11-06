import React from 'react';
import { Pressable, Text, View } from 'react-native';

import useAuth from './hooks/useAuth';
import HomeScreen from './screens/HomeScreen';
import UsernameCreationScreen from './screens/UsernameCreationScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import styles from './styles';

export default function App() {
  const {
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
  } = useAuth();

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
            onPress={retryStartup}
          >
            <Text style={styles.googleButtonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (user && !user.username) {
    return (
      <UsernameCreationScreen
        onContinue={handleCreateUsername}
        isSaving={isSavingProfile}
        serverError={profileError}
        onUsernameChange={clearProfileError}
      />
    );
  }

  if (user) {
    return (
      <HomeScreen
        user={user}
        onSaveProfile={handleUpdateProfile}
        onLogout={handleLogout}
        onProfileChange={clearProfileError}
        isSavingProfile={isSavingProfile}
        isLoggingOut={isLoggingOut}
        profileError={profileError}
      />
    );
  }

  //app render
  return (
    <WelcomeScreen
      onContinue={handleGoogleSignIn}
      isSigningIn={isSigningIn}
    />
  );
}
