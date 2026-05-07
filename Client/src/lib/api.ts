// ---------------------------------------------------------------------------
// API Service Layer — thin fetch wrapper for the Spring Boot backend
// ---------------------------------------------------------------------------

const BASE_URL = "/api/v1";
const STORAGE_KEY = "rahma_auth_user";

// ----- Types ---------------------------------------------------------------

export interface PageItem {
  name: string;
  path: string;
}

export interface AuthResponse {
  token: string;
  type: string;          // "Bearer"
  email: string;
  role: "ADMIN" | "MEDECIN" | "SECRETAIRE" | "PATIENT";
  passwordChanged: boolean;
  pages?: PageItem[];
}

export class ApiError extends Error {
  status: number;
  errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

// ----- Helpers -------------------------------------------------------------

function clearAuthAndRedirect(path: string) {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = path;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
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

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let message = "Une erreur est survenue";
    let errorCode: string | undefined;

    // Try to read JSON error body
    try {
      const body = await res.json();
      message = body.message || body.error || message;
      errorCode = body.error;
    } catch {
      // body wasn't JSON
    }

    if (res.status === 401) {
      // Stale or invalid token → clear and redirect to login
      clearAuthAndRedirect("/login");
      throw new ApiError("Session expirée — veuillez vous reconnecter", 401, errorCode);
    }

    if (res.status === 403) {
      if (errorCode === "PASSWORD_CHANGE_REQUIRED" || message.includes("changer votre mot de passe")) {
        clearAuthAndRedirect("/change-password");
        throw new ApiError(message, 403, "PASSWORD_CHANGE_REQUIRED");
      }
    }

    if (res.status === 429) {
      throw new ApiError("Trop de tentatives — réessayez dans 1 minute", 429);
    }

    if (res.status >= 500) {
      throw new ApiError("Erreur serveur — réessayez plus tard", res.status);
    }

    throw new ApiError(message, res.status, errorCode);
  }

  // Unwrap Spring Boot ApiResponse envelope { success, data, message, ... }
  const json = await res.json();
  if (json && json.data !== undefined) {
    return json.data as T;
  }
  return json as T;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export interface RegisterRequestDto {
  nom: string;
  prenom: string;
  cin: string;
  dateNaissance?: string;
  telephone?: string;
  adresse?: string;
  email: string;
  password: string;
}

export async function register(data: RegisterRequestDto): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface ChangePasswordDto {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

export async function changePasswordApi(data: ChangePasswordDto): Promise<void> {
  return request<void>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalPatients: number;
  totalMedecins: number;
  totalRendezVous: number;
  totalConsultations: number;
  rdvAujourdhui: number;
  rdvPlanifies: number;
  dossierEnAttente: number;
  patientsParMutuelle: Record<string, number>;
  rendezVousParMois?: Record<string, Record<string, number>>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/dashboard/stats");
}

// ---------------------------------------------------------------------------
// Patient endpoints
// ---------------------------------------------------------------------------

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
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: unknown;
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
  page = 0,
  size = 10,
  search = ""
): Promise<PaginatedResponse<Patient>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) q.append("search", search);
  return request<PaginatedResponse<Patient>>(`/patients?${q}`);
}

export async function createPatient(data: PatientRequestDto): Promise<Patient> {
  return request<Patient>("/patients", { method: "POST", body: JSON.stringify(data) });
}

export async function updatePatient(id: number, data: PatientRequestDto): Promise<Patient> {
  return request<Patient>(`/patients/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deletePatient(id: number): Promise<void> {
  return request<void>(`/patients/${id}`, { method: "DELETE" });
}

export async function getPatientById(id: number): Promise<Patient> {
  return request<Patient>(`/patients/${id}`);
}

export async function getPatientConsultations(
  patientId: number,
  page = 0,
  size = 20
): Promise<PaginatedResponse<Consultation>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return request<PaginatedResponse<Consultation>>(`/patients/${patientId}/consultations?${q}`);
}

export async function getPatientRendezVous(
  patientId: number,
  page = 0,
  size = 20
): Promise<PaginatedResponse<RendezVous>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return request<PaginatedResponse<RendezVous>>(`/patients/${patientId}/rendez-vous?${q}`);
}

// ---------------------------------------------------------------------------
// Medecin endpoints
// ---------------------------------------------------------------------------

export interface Medecin {
  id: number;
  nom: string;
  prenom: string;
  specialite: string;
  telephone: string;
  email: string;
}

export interface MedecinRequestDto {
  nom: string;
  prenom: string;
  specialite: string;
  telephone?: string;
  email: string;
  password: string;
  disponible?: boolean;
}

export async function getMedecins(
  page = 0,
  size = 10,
  search = ""
): Promise<PaginatedResponse<Medecin>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) q.append("search", search);
  return request<PaginatedResponse<Medecin>>(`/medecins?${q}`);
}

export async function createMedecin(data: MedecinRequestDto): Promise<Medecin> {
  return request<Medecin>("/medecins", { method: "POST", body: JSON.stringify(data) });
}

export async function updateMedecin(id: number, data: Partial<MedecinRequestDto>): Promise<Medecin> {
  return request<Medecin>(`/medecins/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteMedecin(id: number): Promise<void> {
  return request<void>(`/medecins/${id}`, { method: "DELETE" });
}

export async function getMedecinById(id: number): Promise<Medecin> {
  return request<Medecin>(`/medecins/${id}`);
}

/** Returns the Médecin profile for the currently authenticated MEDECIN user. */
export async function getMedecinMe(): Promise<Medecin> {
  return request<Medecin>(`/medecins/me`);
}

// ---------------------------------------------------------------------------
// Consultation endpoints
// ---------------------------------------------------------------------------

export interface Consultation {
  id: number;
  dateVisite: string;        // ISO datetime string
  motif?: string;
  diagnostic?: string;
  diagnosticPatient?: string;
  notes?: string;
  actesRealises?: string;
  montantTotal?: number;
  patientId: number;
  patientNom: string;
  patientPrenom: string;
  patientCin?: string;
  medecinId: number;
  medecinNom: string;
  medecinPrenom: string;
  medecinSpecialite?: string;
  rendezVousId?: number;
}

export interface ConsultationRequestDto {
  dateVisite: string;        // ISO datetime: "2026-05-01T10:30:00"
  motif?: string;
  diagnostic?: string;
  diagnosticPatient?: string;
  notes?: string;
  actesRealises?: string;
  montantTotal?: number;
  patientId: number;
  medecinId: number;
  rendezVousId?: number;
}

export async function getConsultations(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Consultation>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return request<PaginatedResponse<Consultation>>(`/consultations?${q}`);
}

export async function getConsultationById(id: number): Promise<Consultation> {
  return request<Consultation>(`/consultations/${id}`);
}

export async function createConsultation(data: ConsultationRequestDto): Promise<Consultation> {
  return request<Consultation>("/consultations", { method: "POST", body: JSON.stringify(data) });
}

export async function updateConsultation(
  id: number,
  data: ConsultationRequestDto
): Promise<Consultation> {
  return request<Consultation>(`/consultations/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function getConsultationsByMedecin(
  medecinId: number,
  page = 0,
  size = 20
): Promise<PaginatedResponse<Consultation>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return request<PaginatedResponse<Consultation>>(`/consultations/medecin/${medecinId}?${q}`);
}

export async function getConsultationsByPatient(
  patientId: number,
  page = 0,
  size = 20
): Promise<PaginatedResponse<Consultation>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return request<PaginatedResponse<Consultation>>(`/consultations/patient/${patientId}?${q}`);
}

/** GET /consultations/medecin/me — consultations for the authenticated médecin */
export async function getConsultationsByMedecinMe(
  page = 0,
  size = 10
): Promise<PaginatedResponse<Consultation>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return request<PaginatedResponse<Consultation>>(`/consultations/medecin/me?${q}`);
}

/** GET /consultations/{id} — role-aware: backend filters fields based on JWT role */
export async function getConsultationReport(id: number): Promise<Consultation> {
  return request<Consultation>(`/consultations/${id}`);
}

// ---------------------------------------------------------------------------
// Rendez-vous endpoints
// ---------------------------------------------------------------------------

export interface RendezVous {
  id: number;
  dateHeure: string;
  motif: string;
  notes?: string;
  statut: "PLANIFIE" | "CONFIRME" | "ANNULE" | "TERMINE";
  patientId: number;
  patientNom: string;
  patientPrenom: string;
  medecinId: number;
  medecinNom: string;
  medecinPrenom: string;
  medecinSpecialite: string;
}

export interface RendezVousRequestDto {
  patientId: number;
  medecinId: number;
  dateHeure: string;
  motif?: string;
  notes?: string;
  type?: string;
}

export async function getRendezVous(
  page = 0,
  size = 20
): Promise<PaginatedResponse<RendezVous>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return request<PaginatedResponse<RendezVous>>(`/rendez-vous?${q}`);
}

export async function createRendezVous(data: RendezVousRequestDto): Promise<RendezVous> {
  return request<RendezVous>("/rendez-vous", { method: "POST", body: JSON.stringify(data) });
}

export async function updateRendezVousStatut(
  id: number,
  statut: string
): Promise<RendezVous> {
  return request<RendezVous>(`/rendez-vous/${id}/statut?statut=${statut}`, { method: "PATCH" });
}

export async function updateRendezVous(id: number, data: RendezVousRequestDto): Promise<RendezVous> {
  return request<RendezVous>(`/rendez-vous/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function getRendezVousById(id: number): Promise<RendezVous> {
  return request<RendezVous>(`/rendez-vous/${id}`);
}

// ---------------------------------------------------------------------------
// Secrétaire endpoints
// ---------------------------------------------------------------------------

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
  page = 0,
  size = 10,
  search = ""
): Promise<PaginatedResponse<Secretaire>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) q.append("search", search);
  return request<PaginatedResponse<Secretaire>>(`/secretaires?${q}`);
}

export async function createSecretaire(data: SecretaireRequestDto): Promise<Secretaire> {
  return request<Secretaire>("/secretaires", { method: "POST", body: JSON.stringify(data) });
}

export async function updateSecretaire(id: number, data: SecretaireRequestDto): Promise<Secretaire> {
  return request<Secretaire>(`/secretaires/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteSecretaire(id: number): Promise<void> {
  return request<void>(`/secretaires/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Audit Log endpoints
// ---------------------------------------------------------------------------

export interface AuditLog {
  id: number;
  action: string;
  entite: string;
  entiteId: number;
  utilisateur: string;
  timestamp: string;
  details?: string;
}

export async function getAuditLogs(
  page = 0,
  size = 20
): Promise<PaginatedResponse<AuditLog>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return request<PaginatedResponse<AuditLog>>(`/audit?${q}`);
}

// ---------------------------------------------------------------------------
// Rendez-vous — missing CRUD
// ---------------------------------------------------------------------------

export async function getRendezVousAll(
  page = 0,
  size = 100,
  direction: "asc" | "desc" = "asc"
): Promise<PaginatedResponse<RendezVous>> {
  const q = new URLSearchParams({ page: String(page), size: String(size), sortBy: "dateHeure", direction });
  return request<PaginatedResponse<RendezVous>>(`/rendez-vous?${q}`);
}

export async function updateRendezVousFull(id: number, data: RendezVousRequestDto): Promise<RendezVous> {
  return request<RendezVous>(`/rendez-vous/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteRendezVous(id: number): Promise<void> {
  return request<void>(`/rendez-vous/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Mutuelle endpoints
// ---------------------------------------------------------------------------

export type TypeMutuelle = "CNSS" | "CNOPS" | "ASSURANCE_PRIVEE" | "AUCUNE";

export interface Mutuelle {
  id: number;
  type: TypeMutuelle;
  numeroAffiliation?: string;
  organismeNom?: string;
  dateDebut?: string;
  dateFin?: string;
  tauxRemboursement?: number;
  patientId: number;
  patientNom: string;
  patientPrenom: string;
}

export interface MutuelleRequestDto {
  type: TypeMutuelle;
  numeroAffiliation?: string;
  organismeNom?: string;
  dateDebut?: string;
  dateFin?: string;
  tauxRemboursement?: number;
  patientId: number;
}

export async function getMutuelles(page = 0, size = 20): Promise<PaginatedResponse<Mutuelle>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return request<PaginatedResponse<Mutuelle>>(`/mutuelles?${q}`);
}

export async function getMutuelleById(id: number): Promise<Mutuelle> {
  return request<Mutuelle>(`/mutuelles/${id}`);
}

export async function getMutuelleByPatient(patientId: number): Promise<Mutuelle> {
  return request<Mutuelle>(`/mutuelles/patient/${patientId}`);
}

export async function createMutuelle(data: MutuelleRequestDto): Promise<Mutuelle> {
  return request<Mutuelle>("/mutuelles", { method: "POST", body: JSON.stringify(data) });
}

export async function updateMutuelle(id: number, data: MutuelleRequestDto): Promise<Mutuelle> {
  return request<Mutuelle>(`/mutuelles/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteMutuelle(id: number): Promise<void> {
  return request<void>(`/mutuelles/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Dossier de remboursement endpoints
// ---------------------------------------------------------------------------

export type StatutDossier = "EN_ATTENTE" | "ENVOYE" | "ACCEPTE" | "REJETE" | "REMBOURSE";

export interface DossierRemboursement {
  id: number;
  montantTotal?: number;
  montantRembourse?: number;
  dateCreation: string;
  dateEnvoi?: string;
  statut: StatutDossier;
  patientId: number;
  patientNom: string;
  patientPrenom: string;
  mutuelleId: number;
  mutuelleOrganisme?: string;
  consultationId: number;
  documentJustificatif?: string;
}

export interface DossierRemboursementRequestDto {
  patientId: number;
  mutuelleId: number;
  consultationId: number;
  documentJustificatif?: string;
}

export async function getDossiers(
  page = 0,
  size = 20,
  statut?: StatutDossier
): Promise<PaginatedResponse<DossierRemboursement>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (statut) q.append("statut", statut);
  return request<PaginatedResponse<DossierRemboursement>>(`/dossiers?${q}`);
}

export async function getDossierById(id: number): Promise<DossierRemboursement> {
  return request<DossierRemboursement>(`/dossiers/${id}`);
}

export async function createDossier(data: DossierRemboursementRequestDto): Promise<DossierRemboursement> {
  return request<DossierRemboursement>("/dossiers", { method: "POST", body: JSON.stringify(data) });
}

export async function updateDossierStatut(id: number, statut: StatutDossier): Promise<DossierRemboursement> {
  return request<DossierRemboursement>(`/dossiers/${id}/statut?statut=${statut}`, { method: "PATCH" });
}

export async function getDossiersByPatient(
  patientId: number,
  page = 0,
  size = 20
): Promise<PaginatedResponse<DossierRemboursement>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return request<PaginatedResponse<DossierRemboursement>>(`/dossiers/patient/${patientId}?${q}`);
}

// ---------------------------------------------------------------------------
// AI Chat assistant
// ---------------------------------------------------------------------------

export async function chatAi(message: string): Promise<string> {
  return request<string>("/chat", { method: "POST", body: JSON.stringify({ message }) });
}

// ---------------------------------------------------------------------------
// Patient-role specific API
// ---------------------------------------------------------------------------

export interface Notification {
  id: number;
  titre: string;
  message: string;
  type: "RDV_PLANIFIE" | "RDV_CONFIRME" | "RDV_ANNULE" | "ALERTE_MEDICALE" | "RAPPEL" | "SYSTEME";
  lu: boolean;
  dateCreation: string;
  patient?: { id: number };
}

/** GET /patients/me — returns the authenticated patient's profile */
export async function getMyProfile(): Promise<Patient> {
  return request<Patient>("/patients/me");
}

/** PATCH /patients/me — patient updates their own non-critical info */
export async function updateMyProfile(data: Partial<PatientRequestDto>): Promise<Patient> {
  return request<Patient>("/patients/me", { method: "PATCH", body: JSON.stringify(data) });
}

/** GET /patients/me/rendez-vous — paginated list of own RDVs */
export async function getMyRendezVous(
  page = 0,
  size = 20
): Promise<PaginatedResponse<RendezVous>> {
  return request<PaginatedResponse<RendezVous>>(
    `/patients/me/rendez-vous?page=${page}&size=${size}&sort=dateHeure,desc`
  );
}

/** GET /patients/me/consultations — paginated list of own consultations */
export async function getMyConsultations(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Consultation>> {
  return request<PaginatedResponse<Consultation>>(
    `/patients/me/consultations?page=${page}&size=${size}`
  );
}

/** PATCH /rendez-vous/{id}/annuler — patient cancels their own RDV */
export async function cancelMyRendezVous(id: number): Promise<RendezVous> {
  return request<RendezVous>(`/rendez-vous/${id}/annuler`, { method: "PATCH" });
}

/** GET /rendez-vous/medecin/me — all appointments for the authenticated médecin */
export async function getMyRdvsAsMedecin(
  page = 0,
  size = 200,
  direction: "asc" | "desc" = "desc"
): Promise<PaginatedResponse<RendezVous>> {
  const q = new URLSearchParams({ page: String(page), size: String(size), sortBy: "dateHeure", direction });
  return request<PaginatedResponse<RendezVous>>(`/rendez-vous/medecin/me?${q}`);
}

/** GET /rendez-vous/disponibilites/{medecinId}?date=YYYY-MM-DD */
export async function getDisponibilites(
  medecinId: number,
  date: string
): Promise<string[]> {
  return request<string[]>(`/rendez-vous/disponibilites/${medecinId}?date=${date}`);
}

/** GET /notifications/me — paginated notifications for authenticated patient */
export async function getMyNotifications(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Notification>> {
  return request<PaginatedResponse<Notification>>(
    `/notifications/me?page=${page}&size=${size}`
  );
}

/** GET /notifications/me/count-non-lus */
export async function getUnreadCount(): Promise<number> {
  const res = await request<{ count: number }>("/notifications/me/count-non-lus");
  return res.count;
}

/** PATCH /notifications/{id}/lu */
export async function markNotificationRead(id: number): Promise<Notification> {
  return request<Notification>(`/notifications/${id}/lu`, { method: "PATCH" });
}

/** PATCH /notifications/lu-tout */
export async function markAllNotificationsRead(): Promise<void> {
  await request<void>("/notifications/lu-tout", { method: "PATCH" });
}
