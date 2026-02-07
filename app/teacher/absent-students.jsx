import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useBleAdvertiser } from '../../hooks/useBleAdvertiser';
import { BASE_URL } from '../../constants/api';
import { COLORS } from '../../constants/theme';

export default function AbsentStudentsScreen() {
  const { activeSessionId, clearSession } = useAuth();
  const { stopAdvertising } = useBleAdvertiser();
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  const loadAbsentees = async () => {
    try {
      setLoading(true);
      console.log('[AbsentStudents] Loading absentees for session:', activeSessionId);
      
      const r = await fetch(
        `${BASE_URL}/teacher/absent-students?session_id=${activeSessionId}`
      );
      console.log('[AbsentStudents] API Response status:', r.status);
      
      const d = await r.json();
      console.log('[AbsentStudents] Absentees:', d);
      
      setAbsentees(d || []);
      setStatusMessage(`${d?.length || 0} student(s) absent`);
    } catch (error) {
      console.error('[AbsentStudents] Error loading absentees:', error);
      Alert.alert('Error', 'Failed to load absent students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (! activeSessionId) {
      console.warn('[AbsentStudents] No active session');
      router.replace('/teacher');
      return;
    }
    loadAbsentees();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadAbsentees, 5000);
    return () => clearInterval(interval);
  }, [activeSessionId]);

  const markPresent = async (studentUsername) => {
    try {
      console.log('[AbsentStudents] Marking present:', studentUsername);
      
      const r = await fetch(`${BASE_URL}/teacher/mark-present`, {
        method: 'POST',
        headers:  { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          student_username: studentUsername,
        }),
      });

      const d = await r.json();
      console.log('[AbsentStudents] Mark present response:', d);

      if (! r.ok) {
        Alert.alert('Error', d.message || 'Failed to mark student present');
        return;
      }

      Alert.alert('Success', `${studentUsername} marked as present`);
      loadAbsentees();
    } catch (error) {
      console.error('[AbsentStudents] Mark present error:', error);
      Alert.alert('Error', 'Failed to mark student present:  ' + error.message);
    }
  };

  const closeAttendance = async () => {
    try {
      Alert.alert(
        'Close Attendance',
        'Are you sure you want to close this attendance session?',
        [
          {
            text: 'Cancel',
            onPress: () => {},
            style: 'cancel',
          },
          {
            text:  'Close',
            onPress: async () => {
              try {
                setLoading(true);
                console.log('[AbsentStudents] Stopping BLE advertising.. .');
                
                // Stop BLE advertising
                await stopAdvertising();
                console.log('[AbsentStudents] BLE advertising stopped');

                // Close attendance on backend
                console.log('[AbsentStudents] Closing attendance session:', activeSessionId);
                const r = await fetch(`${BASE_URL}/teacher/close-attendance`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ session_id: activeSessionId }),
                });

                const d = await r.json();
                console.log('[AbsentStudents] Close attendance response:', d);

                if (! r.ok) {
                  Alert.alert('Error', d. message || 'Failed to close attendance');
                  return;
                }

                // Clear session and navigate
                await clearSession();
                Alert.alert('Success', 'Attendance session closed');
                router.replace('/teacher');
              } catch (error) {
                console.error('[AbsentStudents] Close attendance error:', error);
                Alert.alert('Error', 'Failed to close attendance: ' + error. message);
                setLoading(false);
              }
            },
            style: 'destructive',
          },
        ]
      );
    } catch (error) {
      console.error('[AbsentStudents] Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  if (loading && absentees.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading absent students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Absent Students</Text>

      {/* Session Info */}
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionLabel}>Session ID:</Text>
        <Text style={styles.sessionId}>{activeSessionId}</Text>
        <Text style={styles. sessionStatus}>🟢 Actively Broadcasting</Text>
      </View>

      {/* Status Message */}
      {statusMessage && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}

      {/* Absent Students List */}
      {absentees.length > 0 ?  (
        <FlatList
          data={absentees}
          scrollEnabled={true}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.studentInfo}>
                <Text style={styles.name}>{item}</Text>
                <Text style={styles.status}>❌ Absent</Text>
              </View>
              <TouchableOpacity
                style={styles.markButton}
                onPress={() => markPresent(item)}
              >
                <Text style={styles.markButtonText}>Mark Present</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>✅ All students present! </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>✅ All students marked present!</Text>
        </View>
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
    justifyContent:  'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 12,
    color:  COLORS.text,
    fontSize: 14,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sessionInfo: {
    backgroundColor: '#e3f2fd',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  sessionLabel: {
    color: '#1976D2',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sessionId: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  sessionStatus: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  statusBox: {
    backgroundColor: '#f5f5f5',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor:  COLORS.primary,
  },
  statusText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:  'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  studentInfo:  {
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  status:  {
    color: '#d32f2f',
    fontSize: 11,
    fontWeight: '500',
  },
  markButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical:  8,
    borderRadius: 6,
    marginLeft: 12,
  },
  markButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color:  COLORS.text,
    fontSize: 16,
    fontWeight:  '500',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: COLORS.danger || '#d32f2f',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButtonText: {
    color:  '#fff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});