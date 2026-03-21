import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";

import { BASE_URL } from "../../constants/api";
import { COLORS } from "../../constants/theme";

export default function DeleteUserScreen() {
  const [role, setRole] = useState(null); // null = not chosen yet
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingUsername, setDeletingUsername] = useState(null);

  const fetchUsers = useCallback(async (selectedRole) => {
    setLoading(true);
    setUsers([]);
    setSearch("");
    try {
      const res = await fetch(
        `${BASE_URL}/admin/list-users?role=${selectedRole}`
      );
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch users");
      }
    } catch {
      Alert.alert("Network Error", "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    fetchUsers(selectedRole);
  };

  const handleDelete = (username) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${username}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDelete(username),
        },
      ]
    );
  };

  const confirmDelete = async (username) => {
    setDeletingUsername(username);
    try {
      const res = await fetch(`${BASE_URL}/admin/delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.username !== username));
        Alert.alert("Deleted", data.message || "User deleted successfully");
      } else {
        Alert.alert("Error", data.message || "Failed to delete user");
      }
    } catch {
      Alert.alert("Network Error", "Unable to connect to server");
    } finally {
      setDeletingUsername(null);
    }
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  // ── Step 1: Role selection ──────────────────────────────────────────────────
  if (role === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Delete User</Text>
        <Text style={styles.subtitle}>Who do you want to delete?</Text>

        <TouchableOpacity
          style={[styles.roleCard, { borderColor: "#ef4444" }]}
          onPress={() => handleSelectRole("teacher")}
        >
          <Ionicons name="person-circle-outline" size={36} color="#ef4444" />
          <Text style={[styles.roleCardText, { color: "#ef4444" }]}>Teacher</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, { borderColor: "#ef4444" }]}
          onPress={() => handleSelectRole("student")}
        >
          <Ionicons name="person-circle-outline" size={36} color="#ef4444" />
          <Text style={[styles.roleCardText, { color: "#ef4444" }]}>Student</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Step 2: List view ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header row with back + title */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setRole(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Delete {role === "teacher" ? "Teachers" : "Students"}
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${role}s…`}
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator
          color={COLORS.primary}
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color={COLORS.muted} />
          <Text style={styles.emptyText}>
            {users.length === 0 ? `No ${role}s found` : "No results match your search"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.username}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.userRow}>
              <View style={styles.userInfo}>
                <Ionicons
                  name={role === "teacher" ? "person-circle" : "school"}
                  size={28}
                  color={COLORS.primary}
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.username}>{item.username}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.deleteBtn,
                  deletingUsername === item.username && styles.deleteBtnDisabled,
                ]}
                onPress={() => handleDelete(item.username)}
                disabled={deletingUsername === item.username}
              >
                {deletingUsername === item.username ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Role selection ──────────────────────────────────────────
  centered: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 26,
    color: COLORS.text,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.muted,
    marginBottom: 36,
  },
  roleCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    backgroundColor: COLORS.inputBg,
    gap: 14,
  },
  roleCardText: {
    fontSize: 18,
    fontWeight: "600",
  },

  // ── List view ───────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 40,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 15,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  username: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  deleteBtn: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  deleteBtnDisabled: {
    backgroundColor: "#b91c1c",
    opacity: 0.7,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
});