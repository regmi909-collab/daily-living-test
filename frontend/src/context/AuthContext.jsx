import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("meditation_guru_token") || null);
  const [loading, setLoading] = useState(true);

  // Initialize and check current user on mount
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem("meditation_guru_token");
      if (storedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          console.warn("Stored token expired or invalid:", err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const loginWithGoogle = async ({ idToken, demoEmail, demoName, demoPicture }) => {
    try {
      const response = await api.googleAuth({
        id_token: idToken || "demo_token",
        demo_email: demoEmail,
        demo_name: demoName,
        demo_picture: demoPicture,
      });

      const { access_token, user: userData } = response;
      localStorage.setItem("meditation_guru_token", access_token);
      setToken(access_token);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("meditation_guru_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.is_admin || false,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
