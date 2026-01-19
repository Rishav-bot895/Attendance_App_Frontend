import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { BASE_URL } from "../../constants/api";
import { COLORS } from "../../constants/theme";

export default function StartAttendanceScreen() {
  const { user, setSession } = useAuth();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    const r = await fetch(`${BASE_URL}/teacher/start-attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.username }),
    });
    const d = await r.json();
    await setSession(d.session_id);
    router.replace("/teacher/absent-students");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start Attendance</Text>
      <TouchableOpacity style={styles.button} onPress={start} disabled={loading}>
        <Text style={styles.text}>{loading ? "Starting..." : "Start Attendance"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", padding: 24 },
  title: { color: COLORS.text, fontSize: 22, textAlign: "center", marginBottom: 32 },
  button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12 },
  text: { textAlign: "center", fontWeight: "600", color: "#000" },
});
