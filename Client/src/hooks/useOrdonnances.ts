"use client";

import { useCallback, useEffect, useState } from "react";
import { ordonnanceService } from "@/services/ordonnanceService";
import type { OrdonnanceRequest, OrdonnanceResponse } from "@/types/ordonnance.types";

export function useOrdonnance(id: number) {
  const [data, setData] = useState<OrdonnanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      ordonnanceService.getById(id)
        .then((value) => { if (!cancelled) setData(value); })
        .catch((err) => { if (!cancelled) setError(err.message || "Erreur de chargement"); })
        .finally(() => { if (!cancelled) setLoading(false); });
    });
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading, error };
}

export function useOrdonnancesByPatient(patientId: number, page = 0) {
  const [data, setData] = useState<OrdonnanceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!patientId) return;
    setLoading(true);
    ordonnanceService.getByPatient(patientId, page)
      .then((res) => setData(res.content ?? []))
      .catch((err) => setError(err.message || "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [patientId, page]);

  useEffect(() => {
    Promise.resolve().then(reload);
  }, [reload]);

  return { data, loading, error, reload };
}

export function useCreateOrdonnance() {
  const [loading, setLoading] = useState(false);

  const mutateAsync = useCallback(async (data: OrdonnanceRequest) => {
    setLoading(true);
    try {
      return await ordonnanceService.create(data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutateAsync, loading };
}

export function useAnnulerOrdonnance() {
  const [loading, setLoading] = useState(false);

  const mutateAsync = useCallback(async (id: number) => {
    setLoading(true);
    try {
      return await ordonnanceService.annuler(id);
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutateAsync, loading };
}
