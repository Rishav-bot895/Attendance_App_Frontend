import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useBle } from "../../hooks/useBle";
import { BASE_URL } from "../../constants/api";

export default function ActiveTeachersScreen() {
  const { user } = useAuth();
  const { nearby, scanning, startScan } = useBle();
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/student/active-teachers`)
      .then((r) => r.json())
      .then(setTeachers)
      .catch(() => Alert.alert("Error", "Failed to load classes"));
  }, []);

  const attemptAttendance = async (sessionId) => {
    if (!nearby) {
      Alert.alert("Too Far", "You are not close enough");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/student/mark-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          session_id: sessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.message);
        return;
      }

      Alert.alert("Success", "Attendance marked");
    } catch {
      Alert.alert("Network Error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Classes</Text>

      <TouchableOpacity style={styles.scanBtn} onPress={startScan}>
        <Text style={styles.scanText}>
          {scanning ? "Scanning..." : "Scan Teacher Beacon"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={teachers}
        keyExtractor={(i) => String(i.session_id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.attBtn, !nearby && styles.disabled]}
            disabled={!nearby}
            onPress={() => attemptAttendance(item.session_id)}
          >
            <Text style={styles.attText}>
              Mark Attendance ({item.teacher_name})
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, textAlign: "center", marginBottom: 16 },
  scanBtn: {
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  scanText: { color: "#fff", textAlign: "center" },
  attBtn: {
    backgroundColor: "#1e90ff",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  disabled: { backgroundColor: "#aaa" },
  attText: { color: "#fff", textAlign: "center" },
});
