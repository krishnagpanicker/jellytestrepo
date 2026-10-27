import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import styles from '../styles';

export default function LogIn({ onLogIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogIn() {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://100.64.40.105:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      onLogIn(data.username);
    }
    catch (error) {
      setErrorMessage(error.message);
      console.error('Unable to log in:', error.message);
    }
    finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Log In</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        autoCapitalize="none"
        onChangeText={setUsername}
        placeholder="Enter your username"
        style={styles.input}
        value={username}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry
        style={styles.input}
        value={password}
      />

      <Pressable
        disabled={isSubmitting}
        onPress={handleLogIn}
        style={[styles.headerButton, isSubmitting && styles.disabledButton]}
      >
        <Text style={styles.headerButtonText}>Log In</Text>
      </Pressable>

      {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
    </View>
  );
}
