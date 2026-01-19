import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { BASE_URL } from "../../constants/api";
import { COLORS } from "../../constants/theme";

// 🔥 ADD THIS IMPORT
import BleAdvertiser from "react-native-ble-advertiser";

export default function AbsentStudentsScreen() {
  const { activeSessionId, clearSession } = useAuth();
  const [absentees, setAbsentees] = useState([]);

  const loadAbsentees = async () => {
    const r = await fetch(
      `${BASE_URL}/teacher/absent-students?session_id=${activeSessionId}`
    );
    const d = await r.json();
    setAbsentees(d);
  };

  useEffect(() => {
    loadAbsentees();
  }, []);

  const markPresent = async (student) => {
    const r = await fetch(`${BASE_URL}/teacher/mark-present`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: activeSessionId,
        student_username: student,
      }),
    });

    const d = await r.json();
    if (!r.ok) {
      Alert.alert("Error", d.message);
      return;
    }

    loadAbsentees();
  };

  const closeAttendance = async () => {
    try {
      // 🔥 STOP BLE ADVERTISING
      await BleAdvertiser.stopBroadcast();
    } catch (e) {
      console.log("BLE stop error:", e);
    }

    await fetch(`${BASE_URL}/teacher/close-attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: activeSessionId }),
    });

    await clearSession();
    router.replace("/teacher");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Absent Students</Text>

      <FlatList
        data={absentees}
        keyExtractor={(i) => i}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item}</Text>
            <TouchableOpacity
              style={styles.mark}
              onPress={() => markPresent(item)}
            >
              <Text style={styles.markText}>Mark Present</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.close} onPress={closeAttendance}>
        <Text style={styles.markText}>Close Attendance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    textAlign: "center",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  name: {
    color: COLORS.text,
  },
  mark: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 8,
  },
  markText: {
    color: "#000",
    fontWeight: "600",
  },
  close: {
    backgroundColor: COLORS.danger,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
});
