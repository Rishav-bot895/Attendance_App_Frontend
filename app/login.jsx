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
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../constants/api";
import { COLORS } from "../constants/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const { role } = useLocalSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.message || "Login failed");
        return;
      }

      await login(data);

      if (role === "admin") router.replace("/admin");
      else if (role === "teacher") router.replace("/teacher");
      else router.replace("/student");
    } catch {
      Alert.alert("Network Error");
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
        <Text style={styles.title}>Login ({role})</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={COLORS.muted}
          value={username}
          onChangeText={setUsername}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
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

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Login"}
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
    marginBottom: 32,
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
    marginBottom: 24,
  },
  passwordInput: {
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
    top: 14,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 16,
  },
});
