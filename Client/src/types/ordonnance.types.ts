export type StatutOrdonnance = "ACTIVE" | "EXPIREE" | "ANNULEE";

export interface LigneMedicamentRequest {
  nomMedicament: string;
  dosage: string;
  frequence: string;
  duree: string;
  instructions?: string;
}

export interface OrdonnanceRequest {
  consultationId: number;
  dureeTraitement: string;
  instructions?: string;
  medicaments: LigneMedicamentRequest[];
}

export interface LigneMedicamentResponse {
  id: number;
  nomMedicament: string;
  dosage: string;
  frequence: string;
  duree: string;
  instructions?: string;
}

export interface OrdonnanceResponse {
  id: number;
  dateCreation: string;
  dureeTraitement: string;
  instructions?: string;
  statut: StatutOrdonnance;
  medicaments: LigneMedicamentResponse[];
  medecin: { id: number; nom: string; prenom: string; specialite: string };
  patient: { id: number; nom: string; prenom: string; cin: string };
  consultation: { id: number; dateVisite: string; motif: string };
}

