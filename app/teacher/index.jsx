import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function TeacherDashboard() {
  const { activeSessionId } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teacher Dashboard</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/teacher/start-attendance")}
      >
        <Text style={styles.buttonText}>Start Attendance</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          !activeSessionId && styles.buttonDisabled,
        ]}
        disabled={!activeSessionId}
        onPress={() => router.push("/teacher/absent-students")}
      >
        <Text style={styles.buttonText}>View Absent Students</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#1e90ff",
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#aaa",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
