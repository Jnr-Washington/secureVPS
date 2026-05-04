import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiLogin, apiSignup, apiLogout, apiGetMe, type UserResponse } from "@/api/auth";

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }
    apiGetMe(token)
      .then(user => setState({ user, accessToken: token, isLoading: false }))
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setState({ user: null, accessToken: null, isLoading: false });
      });
  }, []);

  async function login(email: string, password: string) {
    const tokens = await apiLogin(email, password);
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const user = await apiGetMe(tokens.access_token);
    setState({ user, accessToken: tokens.access_token, isLoading: false });
  }

  async function signup(email: string, password: string) {
    await apiSignup(email, password);
    await login(email, password);
  }

  async function logout() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) await apiLogout(refreshToken);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setState({ user: null, accessToken: null, isLoading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
