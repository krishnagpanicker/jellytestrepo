import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '../components/Logo';

export default function UsernameCreationScreen({
  onContinue,
  isSaving,
  serverError,
  onUsernameChange,
}) {
  //username + validation state
  const [username, setUsername] = useState('');
  const [validationError, setValidationError] = useState(null);
  //get avatarInital + error
  const trimmedUsername = username.trim();
  const avatarInitial = trimmedUsername.charAt(0).toUpperCase() || '?';
  const error = validationError || serverError;

  //update username state
  function updateUsername(value) {
    setUsername(value);
    setValidationError(null);
    onUsernameChange();
  }

  function submitUsername() {
    //ensure valid username
    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      setValidationError('Username must be 2–20 characters.');
      return;
    }

    if (!/^[A-Za-z0-9_]+$/.test(trimmedUsername)) {
      setValidationError('Use only letters, numbers, and underscores.');
      return;
    }

    //run onContinue -> username create handler
    onContinue(trimmedUsername);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.screen}
          keyboardShouldPersistTaps="handled"
        >
          <Logo compact />

          <View style={styles.content}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            </View>

            <Text style={styles.eyebrow}>Your Jelly profile</Text>
            <Text style={styles.heading}>What should others call you?</Text>
            <Text style={styles.supportingText}>
              This is how you’ll show up when listening together.
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSaving}
                maxLength={20}
                onChangeText={updateUsername}
                onSubmitEditing={submitUsername}
                placeholder="Your username"
                placeholderTextColor="#766987"
                returnKeyType="done"
                style={[styles.input, error && styles.inputError]}
                value={username}
              />

              <View style={styles.inputMeta}>
                <Text style={[styles.hint, error && styles.errorText]}>
                  {error || 'Letters, numbers, and underscores'}
                </Text>
                <Text style={styles.characterCount}>{username.length}/20</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isSaving }}
            disabled={isSaving}
            onPress={submitUsername}
            style={({ pressed }) => [
              styles.continueButton,
              pressed && !isSaving && styles.continueButtonPressed,
              isSaving && styles.continueButtonDisabled,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fbf8ef',
  },
  keyboardView: {
    flex: 1,
  },
  screen: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    paddingTop: 56,
  },
  avatar: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 38,
    backgroundColor: '#D8C2FF',
  },
  avatarText: {
    color: '#2e174b',
    fontSize: 28,
    fontWeight: '800',
  },
  eyebrow: {
    marginTop: 24,
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heading: {
    marginTop: 8,
    maxWidth: 330,
    color: '#2e174b',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 40,
  },
  supportingText: {
    marginTop: 12,
    maxWidth: 310,
    color: '#766987',
    fontSize: 15,
    lineHeight: 23,
  },
  form: {
    marginTop: 40,
  },
  label: {
    marginBottom: 8,
    color: '#2e174b',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    height: 60,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5deea',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    color: '#2e174b',
    fontSize: 16,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#bf3b58',
  },
  inputMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  hint: {
    flex: 1,
    color: '#766987',
    fontSize: 12,
    lineHeight: 17,
  },
  errorText: {
    color: '#bf3b58',
  },
  characterCount: {
    color: '#766987',
    fontSize: 12,
    lineHeight: 17,
  },
  continueButton: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
  },
  continueButtonPressed: {
    opacity: 0.85,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
