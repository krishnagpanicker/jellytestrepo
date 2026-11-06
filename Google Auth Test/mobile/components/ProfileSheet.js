import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import AvatarColorPicker from './AvatarColorPicker';

export default function ProfileSheet({
  user,
  onClose,
  onSave,
  onLogout,
  onProfileChange,
  isSaving,
  isLoggingOut,
  saveError,
}) {
  const [username, setUsername] = useState(user.username);
  const [avatarColor, setAvatarColor] = useState(
    user.avatarColor || '#D8C2FF'
  );
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const trimmedUsername = username.trim();
  const avatarInitial = trimmedUsername.charAt(0).toUpperCase() || '?';
  const error = validationError || saveError;
  const missingFields = user.missingGoogleFields || [];

  function updateUsername(value) {
    setUsername(value);
    setValidationError(null);
    onProfileChange();
  }

  async function saveProfile() {
    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      setValidationError('Username must be 2–20 characters.');
      return;
    }

    if (!/^[A-Za-z0-9_]+$/.test(trimmedUsername)) {
      setValidationError('Use only letters, numbers, and underscores.');
      return;
    }

    const saved = await onSave({
      username: trimmedUsername,
      avatarColor,
    });

    if (saved) {
      onClose();
    }
  }

  function requestClose() {
    if (!isSaving && !isLoggingOut) {
      onClose();
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={requestClose}
      transparent
      visible
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modal}
      >
        <Pressable
          accessibilityLabel="Close profile settings"
          onPress={requestClose}
          style={styles.backdrop}
        />

        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Your profile</Text>
              <Text style={styles.title}>Settings</Text>
            </View>
            <Pressable
              accessibilityLabel="Close settings"
              accessibilityRole="button"
              disabled={isSaving || isLoggingOut}
              onPress={requestClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.avatarRow}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: avatarColor },
                ]}
              >
                <Text style={styles.avatarText}>{avatarInitial}</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Jelly username</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSaving && !isLoggingOut}
                maxLength={20}
                onChangeText={updateUsername}
                onSubmitEditing={saveProfile}
                returnKeyType="done"
                style={[styles.input, error && styles.inputError]}
                value={username}
              />
              <View style={styles.fieldMeta}>
                <Text style={[styles.hint, error && styles.errorText]}>
                  {error || 'Letters, numbers, and underscores'}
                </Text>
                <Text style={styles.count}>{username.length}/20</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Avatar color</Text>
              <Pressable
                accessibilityLabel={`Change avatar color. Current color ${avatarColor}`}
                accessibilityRole="button"
                disabled={isSaving || isLoggingOut}
                onPress={() => setIsColorPickerOpen(true)}
                style={({ pressed }) => [
                  styles.colorButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: avatarColor },
                  ]}
                />
                <Text style={styles.colorValue}>{avatarColor}</Text>
                <Text style={styles.colorChevron}>›</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Google account name</Text>
              <TextInput
                editable={false}
                selectTextOnFocus={false}
                style={[styles.input, styles.readOnlyInput]}
                value={user.googleName || 'Unavailable'}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Google email</Text>
              <TextInput
                editable={false}
                selectTextOnFocus={false}
                style={[styles.input, styles.readOnlyInput]}
                value={user.googleEmail || 'Unavailable'}
              />
            </View>

            {missingFields.length > 0 && (
              <Text style={styles.missingDataText}>
                Missing Google profile data: {missingFields.join(', ')}.
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              disabled={isSaving || isLoggingOut}
              onPress={saveProfile}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.buttonPressed,
                (isSaving || isLoggingOut) &&
                  styles.disabledButton,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>Save changes</Text>
              )}
            </Pressable>

            <View style={styles.logoutSection}>
              <Pressable
                accessibilityRole="button"
                disabled={isSaving || isLoggingOut}
                onPress={onLogout}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                {isLoggingOut ? (
                  <ActivityIndicator color="#bf3b58" />
                ) : (
                  <Text style={styles.logoutButtonText}>Log out</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {isColorPickerOpen && (
        <AvatarColorPicker
          color={avatarColor}
          onCancel={() => setIsColorPickerOpen(false)}
          onSelect={(color) => {
            setAvatarColor(color);
            setIsColorPickerOpen(false);
            onProfileChange();
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46, 23, 75, 0.28)',
  },
  sheet: {
    maxHeight: '92%',
    paddingTop: 12,
    paddingHorizontal: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#fbf8ef',
  },
  handle: {
    width: 44,
    height: 4,
    alignSelf: 'center',
    marginBottom: 18,
    borderRadius: 2,
    backgroundColor: '#e5deea',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 3,
    color: '#2e174b',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#eee5ff',
  },
  closeButtonText: {
    color: '#2e174b',
    fontSize: 28,
    lineHeight: 30,
  },
  content: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 38,
  },
  avatarText: {
    color: '#2e174b',
    fontSize: 28,
    fontWeight: '800',
  },
  avatarNote: {
    flex: 1,
    maxWidth: 180,
    color: '#766987',
    fontSize: 13,
    lineHeight: 19,
  },
  field: {
    marginTop: 20,
  },
  label: {
    marginBottom: 8,
    color: '#2e174b',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5deea',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    color: '#2e174b',
    fontSize: 16,
    fontWeight: '600',
  },
  readOnlyInput: {
    backgroundColor: '#f1edf3',
    color: '#766987',
  },
  inputError: {
    borderColor: '#bf3b58',
  },
  fieldMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 7,
  },
  hint: {
    flex: 1,
    color: '#766987',
    fontSize: 12,
  },
  count: {
    color: '#766987',
    fontSize: 12,
  },
  colorButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5deea',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#e5deea',
    borderRadius: 9,
  },
  colorValue: {
    flex: 1,
    marginLeft: 12,
    color: '#2e174b',
    fontSize: 15,
    fontWeight: '600',
  },
  colorChevron: {
    color: '#766987',
    fontSize: 25,
    lineHeight: 27,
  },
  errorText: {
    color: '#bf3b58',
  },
  missingDataText: {
    marginTop: 12,
    color: '#bf3b58',
    fontSize: 12,
    lineHeight: 17,
  },
  saveButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  logoutSection: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#e5deea',
  },
  logoutButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5deea',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  logoutButtonText: {
    color: '#bf3b58',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
