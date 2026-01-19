import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { BASE_URL } from "../../constants/api";
import { COLORS } from "../../constants/theme";

export default function AbsentStudentsScreen() {
  const { activeSessionId } = useAuth();
  const [absentees, setAbsentees] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/teacher/absent-students?session_id=${activeSessionId}`)
      .then(r => r.json())
      .then(setAbsentees);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Absent Students</Text>

      <FlatList
        data={absentees}
        keyExtractor={(i) => i}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item}</Text>
            <TouchableOpacity style={styles.mark}>
              <Text style={styles.markText}>Mark Present</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.close} onPress={() => router.replace("/teacher")}>
        <Text style={styles.markText}>Close Attendance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 24 },
  title: { color: COLORS.text, fontSize: 22, textAlign: "center", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  name: { color: COLORS.text },
  mark: { backgroundColor: COLORS.primary, padding: 8, borderRadius: 8 },
  markText: { color: "#000", fontWeight: "600" },
  close: { backgroundColor: COLORS.danger, padding: 16, borderRadius: 12, marginTop: 24 },
});
