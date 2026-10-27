import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import styles from '../styles';

const API_URL = 'http://100.64.40.105:3000';

export default function AuthForm({ endpoint, onSuccess, title }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit() {
    const credentials = { username, password };

    setIsSubmitting(true);
    setErrorMessage('');
    //clearing username and password
    setUsername('');
    setPassword('');

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      onSuccess(data);
    }
    catch (error) {
      setErrorMessage(error.message);
      console.error(`${title} failed:`, error.message);
    }
    finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>{title}</Text>

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
        onPress={handleSubmit}
        style={[styles.headerButton, isSubmitting && styles.disabledButton]}
      >
        <Text style={styles.headerButtonText}>{title}</Text>
      </Pressable>

      {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
    </View>
  );
}
