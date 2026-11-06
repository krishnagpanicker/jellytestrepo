import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '../components/Logo';

function GoogleIcon() {
  return (
    <View accessible={false} style={styles.googleIcon}>
      <View style={[styles.googleColor, styles.googleBlue]} />
      <View style={[styles.googleColor, styles.googleRed]} />
      <View style={[styles.googleColor, styles.googleYellow]} />
      <View style={[styles.googleColor, styles.googleGreen]} />
      <View style={styles.googleIconCenter} />
      <View style={styles.googleIconOpening} />
      <View style={styles.googleIconBar} />
    </View>
  );
}

export default function WelcomeScreen({ onContinue, isSigningIn }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.brandSection}>
          <Logo />
          <Text style={styles.tagline}>Listen together.</Text>
        </View>

        <View style={styles.signInSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isSigningIn }}
            disabled={isSigningIn}
            onPress={onContinue}
            style={({ pressed }) => [
              styles.googleButton,
              pressed && !isSigningIn && styles.googleButtonPressed,
            ]}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#7c3aed" />
            ) : (
              <GoogleIcon />
            )}
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fbf8ef',
  },
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 24,
  },
  tagline: {
    marginTop: 24,
    color: '#766987',
    fontSize: 18,
  },
  signInSection: {
    gap: 16,
  },
  googleButton: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5deea',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  googleButtonPressed: {
    opacity: 0.75,
  },
  googleButtonText: {
    color: '#2e174b',
    fontSize: 16,
    fontWeight: '700',
  },
  finePrint: {
    paddingHorizontal: 16,
    color: '#766987',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    overflow: 'hidden',
    borderRadius: 10,
  },
  googleColor: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  googleBlue: {
    top: 0,
    right: 0,
    backgroundColor: '#4285f4',
  },
  googleRed: {
    top: 0,
    left: 0,
    backgroundColor: '#ea4335',
  },
  googleYellow: {
    bottom: 0,
    left: 0,
    backgroundColor: '#fbbc05',
  },
  googleGreen: {
    right: 0,
    bottom: 0,
    backgroundColor: '#34a853',
  },
  googleIconCenter: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  googleIconOpening: {
    position: 'absolute',
    top: 6,
    right: 0,
    width: 9,
    height: 7,
    backgroundColor: '#ffffff',
  },
  googleIconBar: {
    position: 'absolute',
    top: 9,
    right: 0,
    width: 9,
    height: 4,
    backgroundColor: '#4285f4',
  },
});
