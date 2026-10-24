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

export async function fetchComplaintPhoto(token, photoUrl) {
  const photoPath = new URL(photoUrl, API_BASE_URL);
  const apiUrl = new URL(`${photoPath.pathname}${photoPath.search}`, API_BASE_URL);
  const response = await fetch(apiUrl, {
    headers: { Accept: "image/*", ...authHeader(token) },
  });
  if (!response.ok) {
    throw new Error("Could not load the complaint photo.");
  }

  return URL.createObjectURL(await response.blob());
}

/** Normalise the many shapes a Laravel login endpoint might return. */
function normaliseUser(rawUser = {}) {
  const residentProfile = rawUser.resident_profile ?? rawUser.residentProfile ?? null;
  const septicSystem = rawUser.septic_system ?? rawUser.septicSystem ?? null;

  return {
    ...rawUser,
    role: ["admin", "hoa_admin"].includes(rawUser.role) ? "admin" : "resident",
    demo_mode: Boolean(rawUser.demo_mode ?? rawUser.demoMode ?? false),
    resident_profile: residentProfile,
    septic_system: septicSystem,
  };
}

function normaliseLoginResponse(data) {
  const obj = data ?? {};
  const dataNested = obj.data ?? {};
  const token =
    obj.token ?? obj.access_token ?? dataNested.token ?? "";
  const user = normaliseUser(obj.user ?? dataNested.user ?? null);

  if (!token || !user) {
    throw new Error("Invalid response from server: missing token or user.");
  }

  return {
    token,
    user,
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
    const message = data?.message ??
      (res.status === 401
        ? "Invalid email or password."
        : res.status === 403
          ? "Your account cannot sign in right now."
          : "Sign in failed. Please try again.");
    throw new Error(String(message));
  }

  return normaliseLoginResponse(data);
}

export async function requestPasswordReset(email) {
  const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    throw new Error(validationMessage ?? data?.message ?? "Could not request a password reset.");
  }
  return data;
}

export async function resetPassword(payload) {
  const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    throw new Error(validationMessage ?? data?.message ?? "Could not reset your password.");
  }
  return data;
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

export function createAdminResident(token, resident) {
  return adminResidentRequest("", token, {
    method: "POST",
    body: JSON.stringify(resident),
  });
}

export async function fetchAdminInformationChangeRequests(token) {
  const response = await adminResidentRequest("/information-change-requests", token);
  return Array.isArray(response?.data) ? response.data : [];
}

export function reviewAdminInformationChangeRequest(token, requestId, status) {
  return adminResidentRequest(`/information-change-requests/${requestId}/review`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchAdminTanks(token) {
  const tankResponse = await fetch(`${API_BASE_URL}/api/admin/tanks`, {
    headers: {
      Accept: "application/json",
      ...authHeader(token),
    },
  });
  const data = await tankResponse.json().catch(() => null);
  if (!tankResponse.ok) {
    throw new Error(data?.message ?? "Could not load tank data.");
  }

  return data?.data ?? { tanks: [], summary: null };
}

export async function recordAdminDesludging(token, tankId, performedOn) {
  const response = await fetch(`${API_BASE_URL}/api/admin/tanks/${encodeURIComponent(tankId)}/desludgings`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify({ performed_on: performedOn }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    throw new Error(validationMessage ?? data?.message ?? "Could not record completed desludging.");
  }
  return data?.data ?? null;
}

export async function dispatchAdminDesludging(token, tankId, scheduledFor) {
  const response = await fetch(`${API_BASE_URL}/api/admin/tanks/${encodeURIComponent(tankId)}/dispatch`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify({ scheduled_for: scheduledFor }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    throw new Error(validationMessage ?? data?.message ?? "Could not schedule desludging.");
  }
  return data?.data ?? null;
}

async function fetchAdminCollection(path, token, fallbackMessage) {
  const response = await fetch(`${API_BASE_URL}/api/admin/${path}`, {
    headers: { Accept: "application/json", ...authHeader(token) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? fallbackMessage);
  return Array.isArray(data?.data) ? data.data : [];
}

export function fetchAdminDevices(token) {
  return fetchAdminCollection("devices", token, "Could not load devices.");
}

export async function createAdminDevice(token, device) {
  const response = await fetch(`${API_BASE_URL}/api/admin/devices`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(device),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    throw new Error(validationMessage ?? data?.message ?? "Could not register device.");
  }
  return data?.data ?? null;
}

export function fetchAdminComplaints(token) {
  return fetchAdminCollection("complaints", token, "Could not load complaints.");
}

export function fetchAdminNotifications(token) {
  return fetchAdminCollection("notifications", token, "Could not load admin notifications.");
}

export async function markAdminNotificationRead(token, notificationId) {
  const response = await fetch(`${API_BASE_URL}/api/admin/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "POST",
    headers: { Accept: "application/json", ...authHeader(token) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? "Could not mark notification as read.");
  return data;
}

export async function fetchAdminReports(token, days = "180") {
  const response = await fetch(`${API_BASE_URL}/api/admin/reports?days=${encodeURIComponent(days)}`, {
    headers: { Accept: "application/json", ...authHeader(token) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? "Could not load admin reports.");
  return data?.data ?? null;
}

export async function updateAdminComplaint(token, complaintId, values) {
  const response = await fetch(`${API_BASE_URL}/api/admin/complaints/${complaintId}/status`, {
    method: "PATCH",
    headers: { Accept: "application/json", "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(values),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? "Could not update complaint status.");
  return data?.data ?? null;
}

export async function fetchResidentTankLatest(token) {
  const response = await fetch(`${API_BASE_URL}/api/resident/tank/latest`, {
    headers: {
      Accept: "application/json",
      ...authHeader(token),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? "Could not load your tank reading.");
  }

  return data?.data ?? null;
}

export async function pairResidentDevice(token, deviceId, tankHeightCm) {
  const response = await fetch(`${API_BASE_URL}/api/resident/tank/pair`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify({ device_id: deviceId, tank_height_cm: tankHeightCm }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    throw new Error(validationMessage ?? data?.message ?? "Could not pair this device.");
  }

  return data?.data ?? null;
}

export async function changeResidentPassword(token, currentPassword, password, passwordConfirmation) {
  const response = await fetch(`${API_BASE_URL}/api/resident/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify({
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    throw new Error(validationMessage ?? data?.message ?? "Could not update your password.");
  }
}

export function uploadResidentProfilePhoto(token, photo) {
  const body = new FormData();
  body.append("photo", photo);
  return residentRequest("profile/photo", token, {
    method: "POST",
    body,
  });
}

export async function fetchResidentProfilePhoto(token) {
  const response = await fetch(`${API_BASE_URL}/api/resident/profile/photo`, {
    headers: { Accept: "image/*", ...authHeader(token) },
  });
  if (!response.ok) {
    throw new Error(response.status === 404
      ? "No profile photo has been uploaded."
      : "Could not load your profile photo.");
  }

  return URL.createObjectURL(await response.blob());
}

async function residentRequest(path, token, options = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api/resident/${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...authHeader(token),
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message ?? "Could not load resident data.");
  return data;
}

export async function fetchResidentComplaints(token) {
  const data = await residentRequest("complaints", token);
  return data?.data ?? [];
}

export async function createResidentComplaint(token, payload) {
  const body = typeof FormData !== "undefined" && payload instanceof FormData
    ? payload
    : JSON.stringify(payload);
  const data = await residentRequest("complaints", token, {
    method: "POST",
    body,
  });
  return data?.data ?? null;
}

export async function fetchResidentNotifications(token) {
  const data = await residentRequest("notifications", token);
  return data?.data ?? [];
}

export async function fetchResidentPushStatus(token, pushToken) {
  const data = await residentRequest("push/status", token, {
    method: "POST",
    body: JSON.stringify({ token: pushToken ?? null }),
  });
  return data?.data ?? null;
}

export function registerResidentPushToken(token, pushToken) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);

  return residentRequest("push/tokens", token, {
    method: "POST",
    body: JSON.stringify({ token: pushToken }),
    signal: controller.signal,
  }).catch((error) => {
    if (error.name === "AbortError") {
      throw new Error("Saving this device to SeptiGuard timed out. Check your connection to the portal and try again.");
    }
    throw error;
  }).finally(() => window.clearTimeout(timeout));
}

export function removeResidentPushToken(token, pushToken) {
  return residentRequest("push/tokens", token, {
    method: "DELETE",
    body: JSON.stringify({ token: pushToken }),
  });
}

export async function fetchResidentAccount(token) {
  const data = await residentRequest("account", token);
  return data?.data ?? null;
}

export function submitResidentInformationChangeRequest(token, payload) {
  return residentRequest("information-change-requests", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchResidentPrediction(token) {
  const data = await residentRequest("prediction", token);
  return data?.data ?? null;
}

export function markResidentNotificationsRead(token) {
  return residentRequest("notifications/read", token, { method: "POST" });
}

export function markResidentNotificationRead(token, notificationId) {
  return residentRequest(`notifications/${notificationId}/read`, token, { method: "POST" });
}

export function updateAdminResidentApproval(token, residentId, status) {
  return adminResidentRequest(`/${residentId}/approval`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deactivateAdminResident(token, residentId) {
  return adminResidentRequest(`/${residentId}/deactivate`, token, {
    method: "PATCH",
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
    const parsedUser = JSON.parse(userRaw);
    return { token, user: normaliseUser(parsedUser) };
  } catch {
    return null;
  }
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}