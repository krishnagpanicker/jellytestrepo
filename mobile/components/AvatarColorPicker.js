import React, { useState } from 'react';
import { BlurView } from 'expo-blur';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

//color picker import
import ColorPicker, {
  HueCircular,
  Panel1,
} from 'reanimated-color-picker';

export default function AvatarColorPicker({
  color,
  onCancel,
  onSelect,
}) {
  const [selectedColor, setSelectedColor] = useState(color);

  function selectColor() {
    onSelect(selectedColor);
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible
    >
      <View
        accessibilityViewIsModal
        style={styles.modal}
      >
        {/* absolute.fill lets the blurred area outside the popup close it */}
        <Pressable
          accessibilityLabel="Close avatar color picker"
          onPress={onCancel}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        >
          <BlurView
            intensity={35}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            tint="dark"
          />
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.title}>Avatar color</Text>
          <Text style={styles.supportingText}>
            Choose a color for your Jelly avatar.
          </Text>

          {/* color picker comp */}
          <ColorPicker
            boundedThumb
            onCompleteJS={({ hex }) => {
              setSelectedColor(hex.toUpperCase());
            }}
            sliderThickness={22}
            style={styles.picker}
            thumbSize={24}
            value={selectedColor}
          >
            <HueCircular
              accessibilityLabel="Avatar color wheel"
              containerStyle={styles.wheelCenter}
            >
              <Panel1
                accessibilityLabel="Avatar color saturation and brightness"
                style={styles.colorPanel}
              />
            </HueCircular>
          </ColorPicker>

          <View style={styles.previewRow}>
            <View
              accessibilityLabel={`Selected color ${selectedColor}`}
              style={[
                styles.preview,
                { backgroundColor: selectedColor },
              ]}
            />
            <Text style={styles.colorValue}>{selectedColor}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={selectColor}
              style={({ pressed }) => [
                styles.doneButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    backgroundColor: 'rgba(46, 23, 75, 0.2)',
  },
  card: {
    width: '100%',
    maxWidth: 320,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#fbf8ef',
  },
  title: {
    color: '#2e174b',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  supportingText: {
    marginTop: 6,
    color: '#766987',
    fontSize: 13,
    lineHeight: 19,
  },
  picker: {
    width: 240,
    alignSelf: 'center',
    marginTop: 18,
  },
  wheelCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPanel: {
    width: '70%',
    height: '70%',
    borderRadius: 1000,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  preview: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#e5deea',
    borderRadius: 8,
  },
  colorValue: {
    color: '#2e174b',
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5deea',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    color: '#2e174b',
    fontSize: 15,
    fontWeight: '700',
  },
  doneButton: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#7c3aed',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
