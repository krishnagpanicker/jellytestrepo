import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import LogIn from './components/LogIn';
import SignUp from './components/SignUp';
import styles from './styles';

export default function App() {
  const [selectedForm, setSelectedForm] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jelly Auth Practice</Text>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => setSelectedForm('signUp')}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Sign Up</Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedForm('logIn')}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Log In</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {selectedForm === 'signUp' && <SignUp />}
        {selectedForm === 'logIn' && <LogIn />}
      </View>
    </View>
  );
}
