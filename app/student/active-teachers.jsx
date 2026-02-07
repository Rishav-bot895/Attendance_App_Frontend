import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { BASE_URL, DEBUG_LOG_INGEST } from "../../constants/api";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useBle } from "../../hooks/useBle";

export default function ActiveTeachersScreen() {
  const { user } = useAuth();
  const { foundSessionIds, scanning, startScan } = useBle();
  const [teachers, setTeachers] = useState([]);
  const [markedSessions, setMarkedSessions] = useState(new Set());
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualSessionId, setManualSessionId] = useState("");

  useEffect(() => {
    loadActiveTeachers();
    // Refresh every 10 seconds
    const interval = setInterval(loadActiveTeachers, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveTeachers = () => {
    fetch(`${BASE_URL}/student/active-teachers`)
      .then((r) => r.json())
      .then((data) => {
        setTeachers(data);
        fetch(DEBUG_LOG_INGEST, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "active-teachers.jsx:loadActiveTeachers",
            message: "API teachers loaded",
            data: {
              sessionIds: (data || []).map((t) => t.session_id),
              types: (data || []).map((t) => typeof t.session_id),
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H3",
          }),
        }).catch(() => {});
      })
      .catch(() => Alert.alert("Error", "Failed to load active classes"));
  };

  const markAttendance = async (sessionId) => {
    if (markedSessions.has(sessionId)) {
      Alert.alert("Already Marked", "You've already marked attendance for this session.");
      return;
    }

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
      Alert.alert("Success", "Attendance marked successfully!");
      loadActiveTeachers();
    } catch {
      Alert.alert("Network Error", "Unable to connect to server");
    }
  };

  const markAttendanceManually = async () => {
    const sessionId = manualSessionId.trim();
    
    if (!sessionId) {
      Alert.alert("Error", "Please enter a session ID");
      return;
    }

    // Check if session exists in active teachers
    const sessionExists = teachers.some((t) => String(t.session_id) === sessionId);
    
    if (!sessionExists) {
      Alert.alert(
        "Session Not Found",
        `Session ${sessionId} is not currently active. Make sure you've entered the correct code.`
      );
      return;
    }

    setShowManualEntry(false);
    await markAttendance(sessionId);
    setManualSessionId("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Classes</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.scanButton, scanning && styles.scanActive]}
          onPress={startScan}
          disabled={scanning}
        >
          <Text style={styles.scanText}>
            {scanning ? "Scanning..." : "🔍 Scan BLE"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowManualEntry(true)}
        >
          <Text style={styles.manualButtonText}>✏️ Manual Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Debug: Show detected sessions */}
      {foundSessionIds.length > 0 && (
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>
            📡 Detected: {foundSessionIds.join(", ")}
          </Text>
        </View>
      )}

      <FlatList
        data={teachers}
        keyExtractor={(i) => String(i.session_id)}
        renderItem={({ item }) => {
          const isMarked = markedSessions.has(item.session_id);
          const apiSessionId = String(item.session_id).trim();
          const isNearby = foundSessionIds.includes(apiSessionId);
          
          // Only allow marking if: 1) Nearby via BLE OR 2) Already marked
          const canMark = isNearby && !isMarked;

          if (item === teachers[0])
            fetch(DEBUG_LOG_INGEST, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "active-teachers.jsx:renderItem",
                message: "First teacher match",
                data: { apiSessionId, foundSessionIds, isNearby, canMark },
                timestamp: Date.now(),
                sessionId: "debug-session",
                hypothesisId: "H3",
              }),
            }).catch(() => {});

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.teacherName}>{item.teacher_name}</Text>
                  <Text style={styles.scheduleText}>
                    {item.day} • {item.start_time} - {item.end_time}
                  </Text>
                </View>
                <View style={styles.statusBadges}>
                  {isMarked && <Text style={styles.markedBadge}>✓ Marked</Text>}
                  {isNearby && !isMarked && (
                    <Text style={styles.nearbyBadge}>📡 Nearby</Text>
                  )}
                </View>
              </View>

              {/* Only show button if nearby OR already marked */}
              {(isNearby || isMarked) && (
                <TouchableOpacity
                  style={[styles.button, !canMark && styles.disabled]}
                  disabled={!canMark}
                  onPress={() => markAttendance(item.session_id)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      !canMark && styles.disabledText,
                    ]}
                  >
                    {isMarked ? "✓ Already Marked" : "Mark Attendance"}
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* Show helpful message if not nearby and not marked */}
              {!isNearby && !isMarked && (
                <Text style={styles.hintText}>
                  Scan to detect teacher or use Manual Entry
                </Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active classes found</Text>
            <Text style={styles.emptySubtext}>
              Ask your teacher to start attendance
            </Text>
          </View>
        }
      />

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualEntry(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Session ID</Text>
            <Text style={styles.modalSubtitle}>
              Ask your teacher for the session code
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., 12345 or ABC123"
              placeholderTextColor={COLORS.muted}
              value={manualSessionId}
              onChangeText={setManualSessionId}
              autoCapitalize="characters"
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowManualEntry(false);
                  setManualSessionId("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={markAttendanceManually}
              >
                <Text style={styles.submitButtonText}>Mark Attendance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 24 },
  title: {
    color: COLORS.text,
    fontSize: 22,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 10,
  },
  scanButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
  },
  scanActive: { backgroundColor: COLORS.border },
  scanText: { color: "#000", textAlign: "center", fontWeight: "600" },
  manualButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
  },
  manualButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  debugBox: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  debugText: {
    color: "#666",
    fontSize: 11,
    textAlign: "center",
    fontFamily: "monospace",
  },
  card: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  teacherName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  scheduleText: {
    color: COLORS.muted,
    fontSize: 11,
  },
  statusBadges: {
    alignItems: "flex-end",
  },
  markedBadge: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  nearbyBadge: {
    color: "#2196F3",
    fontSize: 11,
    fontWeight: "600",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  button: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8 },
  disabled: { backgroundColor: COLORS.border },
  buttonText: { color: "#000", textAlign: "center", fontWeight: "600" },
  disabledText: { color: COLORS.muted },
  hintText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubtext: {
    color: COLORS.muted,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    textAlign: "center",
    fontFamily: "monospace",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    padding: 14,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: COLORS.text,
    textAlign: "center",
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
  },
  submitButtonText: {
    color: "#000",
    textAlign: "center",
    fontWeight: "600",
  },
});