import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import styles from '../styles';

export default function LogIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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
    </View>
  );
}
