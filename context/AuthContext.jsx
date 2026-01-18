import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("auth_user");
      const storedSession = await AsyncStorage.getItem("active_session");

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedSession) setActiveSessionId(Number(storedSession));
    } catch {
      console.log("Failed to load auth state");
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem("auth_user", JSON.stringify(userData));
  };

  const setSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    await AsyncStorage.setItem("active_session", String(sessionId));
  };

  const clearSession = async () => {
    setActiveSessionId(null);
    await AsyncStorage.removeItem("active_session");
  };

  const logout = async () => {
    setUser(null);
    setActiveSessionId(null);
    await AsyncStorage.removeItem("auth_user");
    await AsyncStorage.removeItem("active_session");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeSessionId,
        setSession,
        clearSession,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
