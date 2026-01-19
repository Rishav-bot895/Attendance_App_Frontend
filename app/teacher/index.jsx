import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/theme";

export default function TeacherDashboard() {
  const { activeSessionId } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teacher Dashboard</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/teacher/start-attendance")}>
        <Text style={styles.text}>Start Attendance</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !activeSessionId && styles.disabled]}
        disabled={!activeSessionId}
        onPress={() => router.push("/teacher/absent-students")}
      >
        <Text style={styles.text}>View Absent Students</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", padding: 24 },
  title: { color: COLORS.text, fontSize: 24, textAlign: "center", marginBottom: 32 },
  button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, marginBottom: 16 },
  disabled: { backgroundColor: COLORS.border },
  text: { textAlign: "center", fontWeight: "600", color: "#000" },
});
