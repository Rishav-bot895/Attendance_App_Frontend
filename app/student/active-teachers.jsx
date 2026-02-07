import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL, DEBUG_LOG_INGEST } from "../../constants/api";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useBle } from "../../hooks/useBle";
<<<<<<< Current (Your changes)
=======
import { BASE_URL, DEBUG_LOG_INGEST } from "../../constants/api";
import { COLORS } from "../../constants/theme";
>>>>>>> Incoming (Background Agent changes)

export default function ActiveTeachersScreen() {
  const { user } = useAuth();
  const { foundSessionIds, scanning, startScan } = useBle();
  const [teachers, setTeachers] = useState([]);
  const [markedSessions, setMarkedSessions] = useState(new Set());

  useEffect(() => {
    loadActiveTeachers();
  }, []);

  const loadActiveTeachers = () => {
    fetch(`${BASE_URL}/student/active-teachers`)
      .then((r) => r.json())
      .then((data) => {
        setTeachers(data);
        // #region agent log
        const sessionIds = (data || []).map((t) => t.session_id);
        fetch(DEBUG_LOG_INGEST,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'active-teachers.jsx:loadActiveTeachers',message:'API teachers loaded',data:{sessionIds, types: (data || []).map((t) => typeof t.session_id)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
      })
      .catch(() => Alert.alert("Error", "Failed to load active classes"));
  };

  const markAttendance = async (sessionId) => {
    if (markedSessions.has(sessionId)) return;

    try {
      const r = await fetch(`${BASE_URL}/student/mark-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          session_id: sessionId,
        }),
      });

      const d = await r.json();
      if (!r.ok) {
        Alert.alert("Error", d.message || "Failed to mark attendance");
        return;
      }

      setMarkedSessions(new Set([...markedSessions, sessionId]));
      Alert.alert("Success", "Attendance marked successfully");
      loadActiveTeachers();
    } catch {
      Alert.alert("Network Error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Classes</Text>

      <TouchableOpacity 
        style={[styles.scan, scanning && styles.scanActive]} 
        onPress={startScan}
        disabled={scanning}
      >
        <Text style={styles.scanText}>
          {scanning ? "Scanning..." : "Scan for Nearby Teachers"}
        </Text>
      </TouchableOpacity>

      {/* DEBUG VIEW: Show what the phone actually sees */}
      {foundSessionIds.length > 0 && (
         <Text style={{textAlign:'center', color:'gray', marginBottom:10}}>
            Debug: Found Sessions [{foundSessionIds.join(", ")}]
         </Text>
      )}

      <FlatList
        data={teachers}
        keyExtractor={(i) => String(i.session_id)}
        renderItem={({ item }) => {
          const isMarked = markedSessions.has(item.session_id);

          // ROBUST MATCHING: Convert both to string and trim to be sure
          const apiSessionId = String(item.session_id).trim();
          const isNearby = foundSessionIds.includes(apiSessionId);

          const canMark = isNearby && !isMarked;
          // #region agent log
          if (item === teachers[0]) fetch(DEBUG_LOG_INGEST,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'active-teachers.jsx:renderItem',message:'First teacher match',data:{apiSessionId, foundSessionIds, isNearby, canMark},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
          // #endregion

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.teacherName}>{item.teacher_name}</Text>
                {isMarked && <Text style={styles.markedBadge}>✓ Marked</Text>}
              </View>
              
              <TouchableOpacity
                style={[styles.button, !canMark && styles.disabled]}
                disabled={!canMark}
                onPress={() => markAttendance(item.session_id)}
              >
                <Text style={[styles.buttonText, !canMark && styles.disabledText]}>
                  {isMarked ? "Marked" : isNearby ? "Mark Attendance" : "Out of Range"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No classes found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 24 },
  title: { color: COLORS.text, fontSize: 22, textAlign: "center", marginBottom: 16, fontWeight: "600" },
  scan: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, marginBottom: 16 },
  scanActive: { backgroundColor: COLORS.border },
  scanText: { color: "#000", textAlign: "center", fontWeight: "600" },
  card: { backgroundColor: COLORS.card, padding: 16, borderRadius: 10, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  teacherName: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  markedBadge: { color: "#4CAF50", fontSize: 12, fontWeight: "600" },
  button: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8 },
  disabled: { backgroundColor: COLORS.border },
  buttonText: { color: "#000", textAlign: "center", fontWeight: "600" },
  disabledText: { color: COLORS.muted },
  emptyText: { color: COLORS.muted, textAlign: "center", marginTop: 32 },
});