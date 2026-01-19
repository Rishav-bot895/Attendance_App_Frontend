import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { COLORS } from "../../constants/theme";

export default function StudentDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Dashboard</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/student/active-teachers")}>
        <Text style={styles.text}>Apply Attendance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", padding: 24 },
  title: { color: COLORS.text, fontSize: 24, textAlign: "center", marginBottom: 32 },
  button: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12 },
  text: { textAlign: "center", fontWeight: "600", color: "#000" },
});
