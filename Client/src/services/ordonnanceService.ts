import {
  annulerOrdonnance,
  createOrdonnance,
  downloadOrdonnancePdf,
  getOrdonnanceById,
  getOrdonnancesByPatient,
  getOrdonnances,
} from "@/lib/api";
import type { OrdonnanceRequest, StatutOrdonnance } from "@/types/ordonnance.types";

export const ordonnanceService = {
  create: (data: OrdonnanceRequest) => createOrdonnance(data),
  getById: (id: number) => getOrdonnanceById(id),
  getAll: (page = 0, size = 20, statut?: StatutOrdonnance | "", search = "") =>
    getOrdonnances(page, size, statut, search),
  getByPatient: (patientId: number, page = 0, size = 20) =>
    getOrdonnancesByPatient(patientId, page, size),
  annuler: (id: number) => annulerOrdonnance(id),
  downloadPdf: (id: number, patientNom: string) => downloadOrdonnancePdf(id, patientNom),
};
