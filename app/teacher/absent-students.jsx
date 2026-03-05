import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';

import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useBleAdvertiser } from '../../hooks/useBleAdvertiser';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { BASE_URL } from '../../constants/api';
import { COLORS } from '../../constants/theme';

export default function AbsentStudentsScreen() {
  const { activeSessionId, clearSession } = useAuth();
  const { stopAdvertising } = useBleAdvertiser();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // username being acted on

  const loadStudents = async () => {
    try {
      const r = await fetch(
        `${BASE_URL}/teacher/all-students-status?session_id=${activeSessionId}`
      );
      const d = await r.json();
      setStudents(d || []);
    } catch (error) {
      console.error('[AbsentStudents] Error loading students:', error);
      Alert.alert('Error', 'Failed to load student list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeSessionId) {
      router.replace('/teacher');
      return;
    }
    loadStudents();
    const interval = setInterval(loadStudents, 5000);
    return () => clearInterval(interval);
  }, [activeSessionId]);

  const toggleStatus = async (username, currentStatus) => {
    const isMarkingPresent = currentStatus === 'absent';
    const endpoint = isMarkingPresent ? 'mark-present' : 'mark-absent';

    try {
      setActionLoading(username);
      const r = await fetch(`${BASE_URL}/teacher/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          student_username: username,
        }),
      });

      const d = await r.json();
      if (!r.ok) {
        Alert.alert('Error', d.message || 'Action failed');
        return;
      }

      // Optimistically update local state
      setStudents((prev) =>
        prev.map((s) =>
          s.username === username
            ? { ...s, status: isMarkingPresent ? 'present' : 'absent', manual: true }
            : s
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Network error: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

const downloadCSV = async () => {
  try {
    const url = `${BASE_URL}/teacher/download-attendance?session_id=${activeSessionId}`;

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      Alert.alert("Error", `Server error ${response.status}: ${body}`);
      return;
    }

    const csvText = await response.text();

    const fileUri =
      FileSystem.cacheDirectory +
      `attendance_${activeSessionId}.csv`;

    await FileSystem.writeAsStringAsync(fileUri, csvText, {
      encoding: 'utf8',
    });

    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: "Save Attendance CSV",
    });
  } catch (err) {
    Alert.alert("Error", "Could not download CSV: " + err.message);
  }
};

  const closeAttendance = () => {
    Alert.alert(
      'Close Attendance',
      'Are you sure you want to close this attendance session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await stopAdvertising();

              const r = await fetch(`${BASE_URL}/teacher/close-attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: activeSessionId }),
              });

              const d = await r.json();
              if (!r.ok) {
                Alert.alert('Error', d.message || 'Failed to close attendance');
                setLoading(false);
                return;
              }

              await clearSession();
              Alert.alert('Success', 'Attendance session closed');
              router.replace('/teacher');
            } catch (error) {
              Alert.alert('Error', 'Failed to close attendance: ' + error.message);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;

  if (loading && students.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>

        {/* Download CSV */}
        <TouchableOpacity style={styles.downloadBtn} onPress={downloadCSV}>
          <Text style={styles.downloadBtnText}>⬇ CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Session Info */}
      <View style={styles.sessionInfo}>
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>Session ID</Text>
          <Text style={styles.sessionStatus}>🟢 Broadcasting</Text>
        </View>
        <Text style={styles.sessionId}>{activeSessionId}</Text>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={[styles.statChip, styles.statPresent]}>
          <Text style={styles.statNumber}>{presentCount}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={[styles.statChip, styles.statAbsent]}>
          <Text style={styles.statNumber}>{absentCount}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
        <View style={[styles.statChip, styles.statTotal]}>
          <Text style={styles.statNumber}>{students.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Student List */}
      {students.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No students enrolled</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.username}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isPresent = item.status === 'present';
            const isActing = actionLoading === item.username;

            return (
              <View style={[styles.row, isPresent ? styles.rowPresent : styles.rowAbsent]}>
                {/* Left: name + badge */}
                <View style={styles.studentInfo}>
                  <Text style={styles.name}>{item.username}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, isPresent ? styles.badgePresent : styles.badgeAbsent]}>
                      <Text style={[styles.badgeText, isPresent ? styles.badgeTextPresent : styles.badgeTextAbsent]}>
                        {isPresent ? '✓ Present' : '✗ Absent'}
                      </Text>
                    </View>
                    {item.manual && (
                      <View style={styles.manualBadge}>
                        <Text style={styles.manualBadgeText}>Manual</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Right: toggle button */}
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    isPresent ? styles.toggleBtnRed : styles.toggleBtnGreen,
                    isActing && styles.toggleBtnDisabled,
                  ]}
                  onPress={() => toggleStatus(item.username, item.status)}
                  disabled={isActing}
                >
                  {isActing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.toggleBtnText}>
                      {isPresent ? 'Mark Absent' : 'Mark Present'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Close Attendance Button */}
      <TouchableOpacity
        style={[styles.closeButton, loading && styles.buttonDisabled]}
        onPress={closeAttendance}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.closeButtonText}>Close Attendance</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  downloadBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Session Info
  sessionInfo: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sessionStatus: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  sessionId: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  statChip: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statPresent: { backgroundColor: '#1a3a2a' },
  statAbsent: { backgroundColor: '#3a1a1a' },
  statTotal: { backgroundColor: COLORS.card },
  statNumber: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  rowPresent: {
    backgroundColor: '#0f2a1a',
    borderColor: '#2d6a4f',
  },
  rowAbsent: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  studentInfo: {
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePresent: { backgroundColor: '#1b4332' },
  badgeAbsent: { backgroundColor: '#3b1219' },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextPresent: { color: '#52b788' },
  badgeTextAbsent: { color: '#e76f6f' },
  manualBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  manualBadgeText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '500',
  },

  // Toggle buttons
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnGreen: { backgroundColor: '#22c55e' },
  toggleBtnRed: { backgroundColor: '#ef4444' },
  toggleBtnDisabled: { opacity: 0.5 },
  toggleBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 15,
  },

  // Close button
  closeButton: {
    backgroundColor: COLORS.danger,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonDisabled: { opacity: 0.6 },
});