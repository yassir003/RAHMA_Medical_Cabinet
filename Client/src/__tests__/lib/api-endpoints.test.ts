import {
  ApiError,
  annulerOrdonnance,
  cancelMyRendezVous,
  changePasswordApi,
  chatAi,
  createConsultation,
  createDossier,
  createMedecin,
  createMutuelle,
  createOrdonnance,
  createPatient,
  createRendezVous,
  createSecretaire,
  deleteMedecin,
  deleteMutuelle,
  deletePatient,
  deleteRendezVous,
  deleteSecretaire,
  getAuditLogs,
  getConsultationById,
  getConsultationReport,
  getConsultations,
  getConsultationsByMedecin,
  getConsultationsByMedecinMe,
  getConsultationsByPatient,
  getDashboardStats,
  getDisponibilites,
  getDossierById,
  getDossiers,
  getDossiersByPatient,
  getMedecinById,
  getMedecinMe,
  getMedecins,
  getMutuelleById,
  getMutuelleByPatient,
  getMutuelles,
  getMyConsultations,
  getMyNotifications,
  getMyPatientsAsMedecin,
  getMyProfile,
  getMyRdvsAsMedecin,
  getMyRendezVous,
  getOrdonnanceById,
  getOrdonnances,
  getOrdonnancesByPatient,
  getPatientById,
  getPatientConsultations,
  getPatientRendezVous,
  getPatients,
  getRendezVous,
  getRendezVousAll,
  getRendezVousById,
  getSecretaires,
  getUnreadCount,
  login,
  markAllNotificationsRead,
  markNotificationRead,
  register,
  updateConsultation,
  updateDossierStatut,
  updateMedecin,
  updateMutuelle,
  updateMyProfile,
  updatePatient,
  updateRendezVous,
  updateRendezVousFull,
  updateRendezVousStatut,
  updateSecretaire,
} from "@/lib/api";

const fetchMock = jest.fn();

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function mockData(data: unknown = { id: 1 }) {
  fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data }));
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  localStorage.clear();
});

describe("api endpoint helpers", () => {
  it("should call auth dashboard and patient endpoints with expected request shapes", async () => {
    const patient = { id: 7, nom: "Doe", prenom: "Alice", cin: "AB123", dateNaissance: "", telephone: "", adresse: "" };
    const auth = { token: "abc", type: "Bearer", email: "a@b.com", role: "PATIENT", passwordChanged: true };

    [
      auth,
      auth,
      null,
      { totalPatients: 1 },
      { content: [patient] },
      { content: [patient] },
      patient,
      patient,
      null,
      patient,
      { content: [] },
      { content: [] },
    ].forEach(mockData);

    await login("a@b.com", "secret");
    await register({ nom: "Doe", prenom: "Alice", cin: "AB123", email: "a@b.com", password: "secret" });
    await changePasswordApi({ ancienMotDePasse: "old", nouveauMotDePasse: "new" });
    await getDashboardStats();
    await getPatients(1, 5, "Alice");
    await getMyPatientsAsMedecin(2, 8, "Doe");
    await createPatient(patient);
    await updatePatient(7, patient);
    await deletePatient(7);
    await getPatientById(7);
    await getPatientConsultations(7, 3, 6);
    await getPatientRendezVous(7, 4, 9);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/auth/login",
      "/api/v1/auth/register",
      "/api/v1/auth/change-password",
      "/api/v1/dashboard/stats",
      "/api/v1/patients?page=1&size=5&search=Alice",
      "/api/v1/patients/medecin/me?page=2&size=8&search=Doe",
      "/api/v1/patients",
      "/api/v1/patients/7",
      "/api/v1/patients/7",
      "/api/v1/patients/7",
      "/api/v1/patients/7/consultations?page=3&size=6",
      "/api/v1/patients/7/rendez-vous?page=4&size=9",
    ]);
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ method: "POST" }));
    expect(fetchMock.mock.calls[6][1]).toEqual(expect.objectContaining({ method: "POST", body: JSON.stringify(patient) }));
    expect(fetchMock.mock.calls[7][1]).toEqual(expect.objectContaining({ method: "PUT" }));
    expect(fetchMock.mock.calls[8][1]).toEqual(expect.objectContaining({ method: "DELETE" }));
  });

  it("should call doctor consultation and rendez-vous endpoints with expected request shapes", async () => {
    const doctor = { id: 4, nom: "House", prenom: "Gregory", specialite: "Cardiologue", telephone: "", email: "d@b.com" };
    const consultation = {
      id: 88,
      dateVisite: "2026-05-14T09:00",
      patientId: 7,
      patientNom: "Doe",
      patientPrenom: "Alice",
      medecinId: 4,
      medecinNom: "House",
      medecinPrenom: "Gregory",
    };
    const rdv = {
      id: 30,
      dateHeure: "2026-05-14T10:00",
      motif: "Check",
      statut: "PLANIFIE",
      patientId: 7,
      patientNom: "Doe",
      patientPrenom: "Alice",
      medecinId: 4,
      medecinNom: "House",
      medecinPrenom: "Gregory",
      medecinSpecialite: "Cardiologue",
    };
    const rdvRequest = { patientId: 7, medecinId: 4, dateHeure: "2026-05-14T10:00", motif: "Check" };

    [
      { content: [doctor] },
      doctor,
      doctor,
      null,
      doctor,
      doctor,
      { content: [consultation] },
      consultation,
      consultation,
      consultation,
      { content: [consultation] },
      { content: [consultation] },
      { content: [consultation] },
      consultation,
      { content: [rdv] },
      rdv,
      rdv,
      rdv,
      rdv,
      rdv,
      { content: [rdv] },
      rdv,
      { content: [rdv] },
      ["09:00"],
      null,
    ].forEach(mockData);

    await getMedecins(0, 10, "House");
    await createMedecin({ ...doctor, password: "secret123" });
    await updateMedecin(4, { telephone: "0700" });
    await deleteMedecin(4);
    await getMedecinById(4);
    await getMedecinMe();
    await getConsultations(1, 2);
    await getConsultationById(88);
    await createConsultation(consultation);
    await updateConsultation(88, consultation);
    await getConsultationsByMedecin(4, 2, 5);
    await getConsultationsByPatient(7, 3, 6);
    await getConsultationsByMedecinMe(4, 7);
    await getConsultationReport(88);
    await getRendezVous(1, 3);
    await createRendezVous(rdvRequest);
    await updateRendezVousStatut(30, "CONFIRME");
    await updateRendezVous(30, rdvRequest);
    await getRendezVousById(30);
    await updateRendezVousFull(30, rdvRequest);
    await getRendezVousAll(2, 4, "desc");
    await cancelMyRendezVous(30);
    await getMyRdvsAsMedecin(5, 6, "asc");
    await getDisponibilites(4, "2026-05-14");
    await deleteRendezVous(30);

    expect(fetchMock.mock.calls.map(([url]) => url)).toContain("/api/v1/medecins?page=0&size=10&search=House");
    expect(fetchMock.mock.calls.map(([url]) => url)).toContain("/api/v1/consultations/medecin/me?page=4&size=7");
    expect(fetchMock.mock.calls.map(([url]) => url)).toContain("/api/v1/rendez-vous/30/statut?statut=CONFIRME");
    expect(fetchMock.mock.calls.map(([url]) => url)).toContain("/api/v1/rendez-vous?page=2&size=4&sortBy=dateHeure&direction=desc");
    expect(fetchMock.mock.calls.map(([url]) => url)).toContain("/api/v1/rendez-vous/disponibilites/4?date=2026-05-14");
    expect(fetchMock.mock.calls[16][1]).toEqual(expect.objectContaining({ method: "PATCH" }));
    expect(fetchMock.mock.calls[24][1]).toEqual(expect.objectContaining({ method: "DELETE" }));
  });

  it("should call secretary audit mutuelle dossier notification and chat endpoints", async () => {
    const secretary = { id: 9, nom: "Martin", prenom: "Claire", telephone: "0611", email: "c@b.com" };
    const mutuelle = { id: 3, type: "CNSS", patientId: 7, patientNom: "Doe", patientPrenom: "Alice" };
    const dossier = {
      id: 12,
      dateCreation: "2026-05-14",
      statut: "EN_ATTENTE",
      patientId: 7,
      patientNom: "Doe",
      patientPrenom: "Alice",
      mutuelleId: 3,
      consultationId: 88,
    };
    const notification = { id: 5, titre: "RDV", message: "Confirmé", type: "RDV_CONFIRME", lu: false, dateCreation: "2026-05-14" };

    [
      { content: [secretary] },
      secretary,
      secretary,
      null,
      { content: [] },
      { content: [mutuelle] },
      mutuelle,
      mutuelle,
      mutuelle,
      mutuelle,
      null,
      { content: [dossier] },
      dossier,
      dossier,
      dossier,
      { content: [dossier] },
      "AI response",
      { id: 7, nom: "Doe" },
      { id: 7, nom: "Updated" },
      { content: [] },
      { content: [] },
      { content: [notification] },
      { count: 2 },
      notification,
      null,
    ].forEach(mockData);

    await getSecretaires(1, 11, "Claire");
    await createSecretaire(secretary);
    await updateSecretaire(9, secretary);
    await deleteSecretaire(9);
    await getAuditLogs(2, 30);
    await getMutuelles(3, 40);
    await getMutuelleById(3);
    await getMutuelleByPatient(7);
    await createMutuelle(mutuelle as any);
    await updateMutuelle(3, mutuelle as any);
    await deleteMutuelle(3);
    await getDossiers(4, 50, "EN_ATTENTE");
    await getDossierById(12);
    await createDossier({ patientId: 7, mutuelleId: 3, consultationId: 88 });
    await updateDossierStatut(12, "ENVOYE");
    await getDossiersByPatient(7, 5, 60);
    await chatAi("Hello");
    await getMyProfile();
    await updateMyProfile({ telephone: "0611" });
    await getMyRendezVous(6, 70);
    await getMyConsultations(7, 80);
    await getMyNotifications(8, 90);
    await getUnreadCount();
    await markNotificationRead(5);
    await markAllNotificationsRead();

    const urls = fetchMock.mock.calls.map(([url]) => url);
    expect(urls).toContain("/api/v1/secretaires?page=1&size=11&search=Claire");
    expect(urls).toContain("/api/v1/audit?page=2&size=30");
    expect(urls).toContain("/api/v1/mutuelles?page=3&size=40");
    expect(urls).toContain("/api/v1/dossiers?page=4&size=50&statut=EN_ATTENTE");
    expect(urls).toContain("/api/v1/notifications/me/count-non-lus");
    expect(fetchMock.mock.calls[16][1]).toEqual(expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ message: "Hello" }),
    }));
    expect(fetchMock.mock.calls[24][1]).toEqual(expect.objectContaining({ method: "PATCH" }));
  });

  it("should call ordonnance endpoints with expected request shapes", async () => {
    const ordonnance = {
      id: 22,
      consultationId: 88,
      statut: "ACTIVE",
      dureeTraitement: "7 jours",
      medicaments: [],
    };

    [
      { content: [ordonnance] },
      ordonnance,
      ordonnance,
      { content: [ordonnance] },
      ordonnance,
    ].forEach(mockData);

    await getOrdonnances(1, 12, "ACTIVE" as any, "alice");
    await createOrdonnance({ consultationId: 88, dureeTraitement: "7 jours", medicaments: [] } as any);
    await getOrdonnanceById(22);
    await getOrdonnancesByPatient(7, 2, 13);
    await annulerOrdonnance(22);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/ordonnances?page=1&size=12&statut=ACTIVE&search=alice",
      "/api/v1/ordonnances",
      "/api/v1/ordonnances/22",
      "/api/v1/ordonnances/patient/7?page=2&size=13",
      "/api/v1/ordonnances/22/annuler",
    ]);
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ method: "POST" }));
    expect(fetchMock.mock.calls[4][1]).toEqual(expect.objectContaining({ method: "PATCH" }));
  });

  it("should normalize backend errors when requests fail", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Too many tries" }, false, 429));
    await expect(chatAi("hello")).rejects.toMatchObject({
      name: "ApiError",
      status: 429,
      message: expect.stringContaining("Trop de tentatives"),
    });

    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Backend down" }, false, 503));
    await expect(getDashboardStats()).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
      message: expect.stringContaining("Erreur serveur"),
    });

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "VALIDATION_ERROR" }, false, 400));
    await expect(getPatientById(99)).rejects.toMatchObject({
      status: 400,
      message: "VALIDATION_ERROR",
      errorCode: "VALIDATION_ERROR",
    });
  });
});
