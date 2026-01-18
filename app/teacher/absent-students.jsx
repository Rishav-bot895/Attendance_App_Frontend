import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { BASE_URL } from "../../constants/api";

export default function AbsentStudentsScreen() {
  const { activeSessionId } = useAuth();
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAbsentees();
  }, []);

  const fetchAbsentees = async () => {
    if (!activeSessionId) {
      Alert.alert("Error", "No active attendance session");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${BASE_URL}/teacher/absent-students?session_id=${activeSessionId}`
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed to fetch absentees");
        return;
      }

      setAbsentees(data);
    } catch {
      Alert.alert("Network Error", "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const markPresent = async (studentUsername) => {
    try {
      const response = await fetch(`${BASE_URL}/teacher/mark-present`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: activeSessionId,
          student_username: studentUsername,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed to mark present");
        return;
      }

      Alert.alert("Success", "Student marked present manually");
      fetchAbsentees();
    } catch {
      Alert.alert("Network Error", "Unable to connect to server");
    }
  };

  const closeAttendance = async () => {
    try {
      const response = await fetch(`${BASE_URL}/teacher/close-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeSessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed to close attendance");
        return;
      }

      Alert.alert("Success", "Attendance session closed", [
        { text: "OK", onPress: () => router.replace("/teacher") },
      ]);
    } catch {
      Alert.alert("Network Error", "Unable to connect to server");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Absent Students</Text>

      <FlatList
        data={absentees}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item}</Text>
            <TouchableOpacity
              style={styles.markButton}
              onPress={() => markPresent(item)}
            >
              <Text style={styles.markText}>Mark Present</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.closeButton} onPress={closeAttendance}>
        <Text style={styles.closeText}>Close Attendance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  name: { fontSize: 16 },
  markButton: {
    backgroundColor: "#1e90ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  markText: { color: "#fff", fontSize: 14 },
  closeButton: {
    marginTop: 24,
    backgroundColor: "#d9534f",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontSize: 16, fontWeight: "500" },
});
