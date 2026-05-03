// ---------------------------------------------------------------------------
// API Service Layer — thin fetch wrapper for the Spring Boot backend
// ---------------------------------------------------------------------------

const BASE_URL = "/api/v1";

// ----- Types ---------------------------------------------------------------

export interface PageItem {
  name: string;
  path: string;
}

export interface AuthResponse {
  token: string;
  type: string;   // e.g. "Bearer"
  email: string;
  role: "ADMIN" | "MEDECIN" | "SECRETAIRE" | "PATIENT";
  pages?: PageItem[];
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ----- Helpers -------------------------------------------------------------

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = "Something went wrong";

    if (res.status === 401) {
      message = "Invalid email or password";
    } else if (res.status === 429) {
      message = "Too many requests — please try again later";
    } else if (res.status >= 500) {
      message = "Server error — please try again later";
    } else {
      try {
        const body = await res.json();
        message = body.message || body.error || message;
      } catch {
        // body wasn't JSON — keep the default message
      }
    }

    throw new ApiError(message, res.status);
  }

  const json = await res.json();
  // Handle Spring Boot ApiResponse structure
  if (json && json.data !== undefined) {
    return json.data as T;
  }
  
  return json as T;
}

// ----- Auth endpoints ------------------------------------------------------

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
