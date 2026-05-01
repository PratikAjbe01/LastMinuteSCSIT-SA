import { create } from "zustand";
import { persist } from "zustand/middleware";
import { API_URL } from "../utils/urls";

const URL = `${API_URL}/api/auth`;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,

      error: null,
      isLoading: false,
      isCheckingAuth: true,
      message: null,

      // 🔹 helpers
      clearError: () => set({ error: null }),

      setAuth: (data) => {
        set({
          user: data.user,
          token: data.token,
          role: data.user?.role,
          isAuthenticated: true,
          isCheckingAuth: false,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
          isCheckingAuth: false,
        });
      },

      setUser: (user) =>
        set({
          user,
          role: user?.role,
        }),

      setCheckingAuth: (val) => set({ isCheckingAuth: val }),

      // 🔹 signup
      signup: async (email, password, name, role, rollNumber, department) => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`${URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              name,
              role,
              rollNumber,
              department,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message);

          get().setAuth(data);
          return data;
        } catch (err) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // 🔹 login
      login: async (email, password, role) => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`${URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message);

          // 🔥 Admin OTP flow
          if (data.message === "OTP sent to your email.") {
            return data;
          }

          get().setAuth(data);
          return data;
        } catch (err) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // 🔹 verify admin OTP
      verifyAdminOtp: async (email, code) => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`${URL}/verify-admin-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message);

          get().setAuth(data);
          return data;
        } catch (err) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // 🔹 logout
      logout: () => {
        get().clearAuth();
      },

      // 🔹 verify email
      verifyEmail: async (code) => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`${URL}/verify-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message);

          get().setAuth(data);
          return data;
        } catch (err) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      checkAuth: async () => {
        set({ isCheckingAuth: true });
        const { token, user } = get();

        if (!token || !user) {
          get().clearAuth();
          return;
        }

        try {
          const res = await fetch(`${URL}/check-auth`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message);

          set({
            isAuthenticated: true,
            user: data.user,
            role: data.user.role,
            isCheckingAuth: false,
          });
        } catch (error) {
          console.error("Auth check failed, clearing ghost session:", error);
          get().clearAuth();
        }
      },

      // 🔹 forgot password
      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`${URL}/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message);

          set({ message: data.message });
        } catch (err) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // 🔹 reset password
      resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`${URL}/reset-password/${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message);

          set({ message: data.message });
        } catch (err) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "lastminute-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);