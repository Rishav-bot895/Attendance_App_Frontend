import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useBleAdvertiser } from '../../hooks/useBleAdvertiser';
import { BASE_URL } from '../../constants/api';
import { COLORS } from '../../constants/theme';

export default function StartAttendanceScreen() {
  const { user, setSession } = useAuth();
  const { startAdvertising } = useBleAdvertiser();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [sessionIdCreated, setSessionIdCreated] = useState(null);
  const [bleStatus, setBleStatus] = useState('pending'); // 'pending', 'success', 'failed'

  const updateStatus = (message, type = 'info') => {
    console.log(`[StartAttendance] [${type}] ${message}`);
    setStatusMessage(message);
    setStatusType(type);
  };

  const copySessionId = () => {
    if (sessionIdCreated) {
      Clipboard.setString(String(sessionIdCreated));
      Alert.alert('Copied', 'Session ID copied to clipboard');
    }
  };

  const shareSessionId = async () => {
    if (sessionIdCreated) {
      try {
        await Share.share({
          message: `Join my class! Session ID: ${sessionIdCreated}`,
          title: 'Class Attendance',
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };

  const start = async () => {
    try {
      setLoading(true);
      setBleStatus('pending');
      updateStatus('⏳ Creating attendance session...', 'info');

      // Step 1: Create session on backend
      console.log('[StartAttendance] Creating session for:', user.username);
      const r = await fetch(`${BASE_URL}/teacher/start-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });

      console.log('[StartAttendance] Response status:', r.status);
      const d = await r.json();
      console.log('[StartAttendance] Response data:', d);

      if (!r.ok) {
        updateStatus(`❌ Error: ${d.message || 'Unable to start attendance'}`, 'error');
        Alert.alert('Error', d.message || 'Unable to start attendance');
        setLoading(false);
        return;
      }

      const sessionId = d.session_id;
      console.log('[StartAttendance] Session created:', sessionId);
      setSessionIdCreated(sessionId);
      setSession(sessionId);

      updateStatus(
        `✅ Session Created: ${sessionId}\n⏳ Starting Bluetooth broadcast...`,
        'success'
      );

      // Step 2: Try to start BLE advertising
      console.log('[StartAttendance] Attempting BLE broadcast...');
      let bleStarted = false;
      
      try {
        bleStarted = await startAdvertising(String(sessionId));
        console.log('[StartAttendance] BLE started:', bleStarted);
      } catch (bleError) {
        console.error('[StartAttendance] BLE error:', bleError);
        bleStarted = false;
      }

      if (bleStarted) {
        // BLE Success
        setBleStatus('success');
        updateStatus(
          `✅ Attendance Started!\n\n📢 Broadcasting Session ${sessionId}\n\nNavigating to attendance screen...`,
          'success'
        );

        // Navigate after a brief delay
        setTimeout(() => {
          router.replace('/teacher/absent-students');
        }, 2000);
      } else {
        // BLE Failed - Show options
        setBleStatus('failed');
        updateStatus(
          `⚠️ Bluetooth Broadcasting Failed\n\nSession ID: ${sessionId}\n\nStudents can manually enter this code to mark attendance.`,
          'error'
        );

        Alert.alert(
          'Bluetooth Not Available',
          'BLE advertising failed. Students can manually enter the session code, or you can try again.\n\nSession ID: ' + sessionId,
          [
            {
              text: 'Copy Session ID',
              onPress: () => {
                Clipboard.setString(String(sessionId));
                Alert.alert('Copied', 'Session ID copied! Share it with students.');
              },
            },
            {
              text: 'Try Again',
              onPress: async () => {
                setLoading(true);
                const retry = await startAdvertising(String(sessionId));
                setLoading(false);
                
                if (retry) {
                  setBleStatus('success');
                  setTimeout(() => router.replace('/teacher/absent-students'), 1500);
                } else {
                  Alert.alert('Still Failed', 'Please use manual session entry or restart Bluetooth.');
                }
              },
            },
            {
              text: 'Continue Anyway',
              onPress: () => {
                router.replace('/teacher/absent-students');
              },
              style: 'default',
            },
          ]
        );
      }
    } catch (error) {
      console.error('[StartAttendance] Error:', error);
      updateStatus(`❌ Error: ${error.message}`, 'error');
      Alert.alert('Error', 'Failed to start attendance: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = () => {
    switch (statusType) {
      case 'success':
        return styles.statusSuccess;
      case 'error':
        return styles.statusError;
      case 'info':
      default:
        return styles.statusInfo;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Start Attendance</Text>
      <Text style={styles.subtitle}>Teacher Dashboard</Text>

      {/* Status Message */}
      {statusMessage && (
        <View style={[styles.statusBox, getStatusStyle()]}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}

      {/* Session Info with Actions */}
      {sessionIdCreated && (
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionLabel}>Session ID</Text>
            <View style={styles.bleStatusBadge}>
              {bleStatus === 'success' && (
                <Text style={styles.bleSuccess}>🟢 Broadcasting</Text>
              )}
              {bleStatus === 'failed' && (
                <Text style={styles.bleFailed}>🔴 BLE Failed</Text>
              )}
              {bleStatus === 'pending' && (
                <Text style={styles.blePending}>🟡 Starting...</Text>
              )}
            </View>
          </View>

          <Text style={styles.sessionId}>{sessionIdCreated}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={copySessionId}>
              <Text style={styles.actionButtonText}>📋 Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={shareSessionId}>
              <Text style={styles.actionButtonText}>📤 Share</Text>
            </TouchableOpacity>
          </View>

          {bleStatus === 'failed' && (
            <View style={styles.manualInstructions}>
              <Text style={styles.manualTitle}>📝 Manual Attendance Option:</Text>
              <Text style={styles.manualText}>
                Since Bluetooth failed, students can manually enter the session ID
                above to mark their attendance.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Instructions */}
      {!loading && !sessionIdCreated && (
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>📋 How it works:</Text>
          <Text style={styles.instructionItem}>
            1️⃣ Press "Start Attendance" to create a session
          </Text>
          <Text style={styles.instructionItem}>
            2️⃣ Your device will broadcast via Bluetooth (if available)
          </Text>
          <Text style={styles.instructionItem}>
            3️⃣ Students scan to detect you or enter the session code manually
          </Text>
          <Text style={styles.instructionItem}>
            4️⃣ Review absent students and close the session
          </Text>
        </View>
      )}

      {/* Start Button */}
      {!sessionIdCreated && (
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={start}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#000" size="small" />
              <Text style={styles.loadingText}>Starting...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Start Attendance</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Continue Button (shown after session created) */}
      {sessionIdCreated && !loading && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.replace('/teacher/absent-students')}
        >
          <Text style={styles.continueButtonText}>Continue to Attendance →</Text>
        </TouchableOpacity>
      )}

      {/* Troubleshooting Tips */}
      {bleStatus === 'failed' && (
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>🔧 Troubleshooting:</Text>
          <Text style={styles.tipItem}>• Make sure Bluetooth is turned ON</Text>
          <Text style={styles.tipItem}>• Grant all app permissions in Settings</Text>
          <Text style={styles.tipItem}>• Restart the app</Text>
          <Text style={styles.tipItem}>• Some devices don't support BLE advertising</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  statusBox: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  statusInfo: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196F3',
  },
  statusSuccess: {
    backgroundColor: '#e8f5e9',
    borderLeftColor: '#4CAF50',
  },
  statusError: {
    backgroundColor: '#fff3e0',
    borderLeftColor: '#FF9800',
  },
  statusText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333',
    fontWeight: '500',
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bleStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bleSuccess: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
  },
  bleFailed: {
    color: '#f44336',
    fontSize: 11,
    fontWeight: '600',
  },
  blePending: {
    color: '#FF9800',
    fontSize: 11,
    fontWeight: '600',
  },
  sessionId: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    fontFamily: 'monospace',
    letterSpacing: 3,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  actionButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  manualInstructions: {
    backgroundColor: '#fff9c4',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FBC02D',
  },
  manualTitle: {
    color: '#F57F17',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  manualText: {
    color: '#33691E',
    fontSize: 12,
    lineHeight: 18,
  },
  instructionsBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  instructionItem: {
    color: COLORS.text,
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#000',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#000',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 14,
  },
  tipsBox: {
    backgroundColor: '#ffebee',
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  tipsTitle: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  tipItem: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 18,
  },
});