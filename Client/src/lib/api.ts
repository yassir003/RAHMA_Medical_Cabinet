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

  // Try to attach token from localStorage if we're in the browser
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("rahma_auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) {
          headers.set("Authorization", `Bearer ${parsed.token}`);
        }
      }
    } catch {
      // ignore
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
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

// ----- Patient endpoints ---------------------------------------------------

export interface Patient {
  id: number;
  nom: string;
  prenom: string;
  cin: string;
  dateNaissance: string;
  telephone: string;
  adresse: string;
  groupeSanguin?: string;
  allergies?: string;
  antecedents?: string;
  email?: string;
}

export interface PatientRequestDto {
  nom: string;
  prenom: string;
  cin: string;
  dateNaissance?: string;
  telephone?: string;
  adresse?: string;
  groupeSanguin?: string;
  allergies?: string;
  antecedents?: string;
  email?: string;
  password?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export async function getPatients(
  page: number = 0,
  size: number = 10,
  search: string = ""
): Promise<PaginatedResponse<Patient>> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) {
    queryParams.append("search", search);
  }
  return request<PaginatedResponse<Patient>>(`/patients?${queryParams.toString()}`);
}

export async function createPatient(data: PatientRequestDto): Promise<Patient> {
  return request<Patient>("/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePatient(id: number, data: PatientRequestDto): Promise<Patient> {
  return request<Patient>(`/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePatient(id: number): Promise<void> {
  return request<void>(`/patients/${id}`, {
    method: "DELETE",
  });
}

// ----- Secretaire endpoints ------------------------------------------------

export interface Secretaire {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  assignedDoctor?: string;
}

export interface SecretaireRequestDto {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  password?: string;
}

export async function getSecretaires(
  page: number = 0,
  size: number = 10,
  search: string = ""
): Promise<PaginatedResponse<Secretaire>> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) {
    queryParams.append("search", search);
  }
  return request<PaginatedResponse<Secretaire>>(`/secretaires?${queryParams.toString()}`);
}

export async function createSecretaire(data: SecretaireRequestDto): Promise<Secretaire> {
  return request<Secretaire>("/secretaires", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSecretaire(id: number, data: SecretaireRequestDto): Promise<Secretaire> {
  return request<Secretaire>(`/secretaires/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSecretaire(id: number): Promise<void> {
  return request<void>(`/secretaires/${id}`, {
    method: "DELETE",
  });
}
