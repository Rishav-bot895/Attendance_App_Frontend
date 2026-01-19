import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { BASE_URL } from "../../constants/api";
import { COLORS } from "../../constants/theme";

export default function CreateUserScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    if (!username || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to create user");
        return;
      }

      Alert.alert("Success", data.message, [
        { text: "OK", onPress: () => router.back() },
      ]);

      setUsername("");
      setPassword("");
      setRole("student");
    } catch {
      Alert.alert("Network Error", "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create User</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={COLORS.muted}
          value={username}
          autoCapitalize="none"
          onChangeText={setUsername}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        </View>

        {/* ROLE SELECTION (RESTORED) */}
        <View style={styles.roleRow}>
          {["student", "teacher"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.roleButton,
                role === r && styles.roleActive,
              ]}
              onPress={() => setRole(r)}
            >
              <Text
                style={[
                  styles.roleText,
                  role === r && styles.roleTextActive,
                ]}
              >
                {r.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleCreateUser}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating..." : "Create User"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordContainer: {
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
    top: 14,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  roleButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 8,
  },
  roleActive: {
    backgroundColor: COLORS.primary,
  },
  roleText: {
    color: COLORS.text,
    fontWeight: "500",
  },
  roleTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
});
