import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Logo({ compact = false }) {
  return (
    <View style={[styles.logo, compact && styles.compactLogo]}>
      <View style={[styles.mark, compact && styles.compactMark]}>
        <View
          style={[
            styles.bar,
            styles.shortBar,
            compact && styles.compactBar,
            compact && styles.compactShortBar,
          ]}
        />
        <View
          style={[
            styles.bar,
            styles.tallBar,
            compact && styles.compactBar,
            compact && styles.compactTallBar,
          ]}
        />
        <View
          style={[
            styles.bar,
            styles.mediumBar,
            compact && styles.compactBar,
            compact && styles.compactMediumBar,
          ]}
        />
      </View>
      <Text style={[styles.word, compact && styles.compactWord]}>jelly</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
  },
  compactLogo: {
    flexDirection: 'row',
    gap: 10,
  },
  mark: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  compactMark: {
    height: 24,
    gap: 3,
  },
  bar: {
    width: 11,
    borderRadius: 6,
    backgroundColor: '#7c3aed',
  },
  compactBar: {
    width: 7,
    borderRadius: 4,
  },
  shortBar: {
    height: 23,
  },
  tallBar: {
    height: 40,
  },
  mediumBar: {
    height: 30,
  },
  compactShortBar: {
    height: 14,
  },
  compactTallBar: {
    height: 24,
  },
  compactMediumBar: {
    height: 18,
  },
  word: {
    marginTop: 18,
    color: '#2e174b',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -3,
    lineHeight: 56,
  },
  compactWord: {
    marginTop: 0,
    fontSize: 24,
    letterSpacing: -1.5,
    lineHeight: 28,
  },
});
