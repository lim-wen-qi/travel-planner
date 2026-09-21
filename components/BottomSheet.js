import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";

// A reusable BottomSheet component
// Shows a list of options in a modal sliding up from the bottom
export default function BottomSheet({ visible, onClose, options = [] }) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Dark background overlay that closes sheet when tapped */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* The actual bottom sheet container */}
      <View style={styles.sheet}>
        {/* Render each option passed in props */}
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.option}
            onPress={() => {
              onClose();
              opt.onPress?.();
            }}
          >
            <Text
              style={[
                styles.text,
                opt.destructive && { color: "red" },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Default cancel button */}
        <TouchableOpacity style={styles.option} onPress={onClose}>
          <Text style={[styles.text, { color: "grey" }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "white",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  option: {
    padding: 14,
  },
  text: {
    fontSize: 16,
  },
});
