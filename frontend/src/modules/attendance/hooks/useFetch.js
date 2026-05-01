import { useMemo, useCallback } from "react";
import { useAuthStore } from "../../../store/authStore";
import { API_URL } from "../../../utils/urls";

const BASE = `${API_URL}/api/smart-attendance`;

export const useFetch = () => {
  const { token, clearAuth } = useAuthStore();

  const buildHeaders = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const handleResponse = async (res) => {
    if (res.status === 401) {
      clearAuth(); 
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
      throw new Error("Session expired. Please log in again.");
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  const fetchInstance = useMemo(
    () => ({
      /**
       * GET  /api/smart-attendance{path}
       * @param {string} path  - e.g. "/faculty/my-classes"
       * @param {object} params - query params e.g. { page: 1, limit: 10, search: "john" }
       */
      get: (path, params = {}) => {
        const url = new URL(`${BASE}${path}`);
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") {
            url.searchParams.set(k, String(v));
          }
        });
        return fetch(url.toString(), {
          headers: buildHeaders(),
          credentials: "include",
        }).then(handleResponse);
      },

      /**
       * POST /api/smart-attendance{path}
       */
      post: (path, body = {}) =>
        fetch(`${BASE}${path}`, {
          method: "POST",
          headers: buildHeaders(),
          credentials: "include",
          body: JSON.stringify(body),
        }).then(handleResponse),

      /**
       * PUT /api/smart-attendance{path}
       */
      put: (path, body = {}) =>
        fetch(`${BASE}${path}`, {
          method: "PUT",
          headers: buildHeaders(),
          credentials: "include",
          body: JSON.stringify(body),
        }).then(handleResponse),

      /**
       * DELETE /api/smart-attendance{path}
       */
      delete: (path) =>
        fetch(`${BASE}${path}`, {
          method: "DELETE",
          headers: buildHeaders(),
          credentials: "include",
        }).then(handleResponse),
    }),
    [buildHeaders] 
  );

  return { fetchInstance };
};