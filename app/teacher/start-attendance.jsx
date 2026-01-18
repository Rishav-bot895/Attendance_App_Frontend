import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { BASE_URL } from "../../constants/api";

export default function StartAttendanceScreen() {
  const { user, setSession } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStartAttendance = async () => {
    if (!user) {
      Alert.alert("Error", "Not logged in");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/teacher/start-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed");
        return;
      }

      await setSession(data.session_id);

      Alert.alert("Success", data.message, [
        { text: "OK", onPress: () => router.replace("/teacher/absent-students") },
      ]);
    } catch {
      Alert.alert("Network Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start Attendance</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleStartAttendance}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Starting..." : "Start Attendance"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 22, textAlign: "center", marginBottom: 32 },
  button: {
    backgroundColor: "#1e90ff",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16 },
});
