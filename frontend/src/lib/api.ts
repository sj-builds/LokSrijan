import { getAuthToken } from "@/lib/session";

/**
 * Consistent custom error class for all API calls.
 * Does not redirect; leaves handling to the calling layer / TanStack Query.
 */
export class ApiError extends Error {
  status: number;
  detail?: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isValidationError(): boolean {
    return this.status === 422;
  }
}

/**
 * Base URL for the FastAPI backend.
 * Reads from Vite environment variable with a default of http://localhost:8000.
 */
const API_BASE_URL = (
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_API_BASE_URL"]) ||
  "http://localhost:8000"
).replace(/\/$/, "");

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

/**
 * Parses response body safely, returning either parsed JSON or text, or undefined for empty responses.
 */
async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  try {
    return await response.text();
  } catch {
    return undefined;
  }
}

/**
 * Extracts a friendly human-readable error message from backend error payloads.
 */
function extractErrorMessage(status: number, data: unknown): string {
  if (data && typeof data === "object") {
    const errorObj = data as Record<string, unknown>;

    // FastAPI HTTPException { "detail": "message" }
    const detail = errorObj["detail"];
    if (typeof detail === "string") {
      return detail;
    }

    // FastAPI validation errors { "detail": [{ loc: [...], msg: "..." }] }
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (item && typeof item === "object") {
            const itemObj = item as Record<string, unknown>;
            const locVal = itemObj["loc"];
            const msgVal = itemObj["msg"];
            const loc = Array.isArray(locVal) ? locVal.join(" -> ") : "";
            return loc ? `${loc}: ${String(msgVal)}` : String(msgVal);
          }
          return null;
        })
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join("; ");
      }
    }

    const message = errorObj["message"];
    if (typeof message === "string") {
      return message;
    }
  }

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  switch (status) {
    case 400:
      return "Bad request. Please verify your input.";
    case 401:
      return "Authentication required. Please sign in.";
    case 403:
      return "Access denied. You do not have permission for this action.";
    case 404:
      return "Requested resource not found.";
    case 409:
      return "A conflict occurred with an existing resource.";
    case 422:
      return "Validation failed. Please check the submitted data.";
    case 500:
    case 502:
    case 503:
      return "A server error occurred. Please try again later.";
    default:
      return `Request failed with status ${status}.`;
  }
}

/**
 * Core API request method.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, skipAuth = false, headers: customHeaders, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const headers = new Headers(customHeaders);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  // Attach auth token if available and not explicitly skipped
  if (!skipAuth && !headers.has("Authorization")) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Set Content-Type for JSON body if not set
  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch (error) {
    const isNetworkError =
      error instanceof TypeError ||
      (error instanceof Error && error.message.toLowerCase().includes("failed to fetch"));
    throw new ApiError(
      0,
      isNetworkError
        ? "Unable to connect to the LokSrijan server. Please ensure the backend is running."
        : (error as Error).message || "Network error",
    );
  }

  const bodyData = await parseResponseBody(response);

  if (!response.ok) {
    const message = extractErrorMessage(response.status, bodyData);
    throw new ApiError(response.status, message, bodyData);
  }

  return bodyData as T;
}

/**
 * Convenience HTTP verb helpers.
 */
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) => {
    const reqOptions: RequestOptions = { ...options, method: "POST" };
    if (body !== undefined) {
      reqOptions.body = JSON.stringify(body);
    }
    return apiRequest<T>(path, reqOptions);
  },

  put: <T>(path: string, body?: unknown, options?: RequestOptions) => {
    const reqOptions: RequestOptions = { ...options, method: "PUT" };
    if (body !== undefined) {
      reqOptions.body = JSON.stringify(body);
    }
    return apiRequest<T>(path, reqOptions);
  },

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => {
    const reqOptions: RequestOptions = { ...options, method: "PATCH" };
    if (body !== undefined) {
      reqOptions.body = JSON.stringify(body);
    }
    return apiRequest<T>(path, reqOptions);
  },

  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
