"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ConvexProvider, ConvexReactClient, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";
const convex = new ConvexReactClient(convexUrl);

interface AuthContextType {
  token: string | null;
  user: any;
  couple: any;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  couple: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
});

function AuthInnerProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("ldr_auth_token");
    if (savedToken) {
      setToken(savedToken);
    }
    setIsClientLoaded(true);
  }, []);

  const currentUser = useQuery(
    api.auth.getCurrentUser,
    token ? { token } : "skip"
  );

  const currentCouple = useQuery(
    api.couples.getMyCouple,
    token ? { token } : "skip"
  );

  const logoutMutation = useMutation(api.auth.logout);

  const login = (newToken: string) => {
    localStorage.setItem("ldr_auth_token", newToken);
    setToken(newToken);
  };

  const logout = async () => {
    if (token) {
      try {
        await logoutMutation({ token });
      } catch (e) {
        console.error("Logout error", e);
      }
    }
    localStorage.removeItem("ldr_auth_token");
    setToken(null);
    window.location.href = "/login";
  };

  const isLoading = !isClientLoaded || (!!token && currentUser === undefined);

  return (
    <AuthContext.Provider
      value={{
        token,
        user: currentUser,
        couple: currentCouple,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <AuthInnerProvider>{children}</AuthInnerProvider>
    </ConvexProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
