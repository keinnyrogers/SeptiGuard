/**
 * SeptiGuard API client.
 *
 * Talks to the Laravel Sanctum (token-based) REST API.
 * Base URL defaults to http://localhost:8000 and can be overridden with
 * VITE_API_URL at build time.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const TOKEN_STORAGE_KEY = "septiguard_token";
const USER_STORAGE_KEY = "septiguard_user";

/** Normalise the many shapes a Laravel login endpoint might return. */
function normaliseLoginResponse(data) {
  const obj = data ?? {};
  const dataNested = obj.data ?? {};
  const token =
    obj.token ?? obj.access_token ?? dataNested.token ?? "";
  const user = obj.user ?? dataNested.user ?? null;

  if (!token || !user) {
    throw new Error("Invalid response from server: missing token or user.");
  }

  const role = ["admin", "hoa_admin"].includes(user.role) ? "admin" : "resident";
  return {
    token,
    user: { ...user, role },
  };
}

export async function loginRequest(email, password) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "Could not reach the SeptiGuard server.",
    );
  }

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const message =
      data?.message ??
      (res.status === 401
        ? "Invalid email or password."
        : res.status === 403
          ? "Your account is not approved yet. Please wait for HOA admin approval."
          : "Sign in failed. Please try again.");
    throw new Error(String(message));
  }

  return normaliseLoginResponse(data);
}

/** POST /api/register — creates a pending resident account. */
export async function registerRequest(payload) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Could not reach the SeptiGuard server. Make sure the backend is running.",
    );
  }

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const obj = data ?? {};
    // Laravel validation errors: { message, errors: { field: [msg] } }
    const errors = obj.errors;
    const first = errors ? Object.values(errors)[0]?.[0] : undefined;
    const message =
      first ??
      obj.message ??
      (res.status === 422
        ? "Please check your details and try again."
        : "Registration failed. Please try again.");
    throw new Error(String(message));
  }
}

async function adminResidentRequest(path, token, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/admin/residents${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Could not reach the SeptiGuard server. Make sure the backend is running.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    throw new Error(validationMessage ?? data?.message ?? "Could not update resident accounts.");
  }

  return data;
}

export async function fetchAdminResidents(token) {
  const response = await adminResidentRequest("", token);
  return Array.isArray(response?.data) ? response.data : [];
}

export function updateAdminResidentApproval(token, residentId, status) {
  return adminResidentRequest(`/${residentId}/approval`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function logoutRequest(token) {
  try {
    await fetch(`${API_BASE_URL}/api/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  } catch {
    /* best-effort — clear local state regardless */
  }
}

export function persistSession(token, user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export function readStoredSession() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  const userRaw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!token || !userRaw) return null;
  try {
    return { token, user: JSON.parse(userRaw) };
  } catch {
    return null;
  }
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}