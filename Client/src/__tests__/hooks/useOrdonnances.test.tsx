import { act, renderHook, waitFor } from "@testing-library/react";
import {
  useAnnulerOrdonnance,
  useCreateOrdonnance,
  useOrdonnance,
  useOrdonnancesByPatient,
} from "@/hooks/useOrdonnances";
import { ordonnanceService } from "@/services/ordonnanceService";

jest.mock("@/services/ordonnanceService", () => ({
  ordonnanceService: {
    getById: jest.fn(),
    getByPatient: jest.fn(),
    create: jest.fn(),
    annuler: jest.fn(),
  },
}));

const ordonnance = {
  id: 1,
  dureeTraitement: "5 jours",
  statut: "ACTIVE",
  medicaments: [],
};

describe("useOrdonnances hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should load ordonnance when id is provided", async () => {
    (ordonnanceService.getById as jest.Mock).mockResolvedValue(ordonnance);

    const { result } = renderHook(() => useOrdonnance(1));

    await waitFor(() => expect(result.current.data).toEqual(ordonnance));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should expose error when ordonnance loading fails", async () => {
    (ordonnanceService.getById as jest.Mock).mockRejectedValue(new Error("Not found"));

    const { result } = renderHook(() => useOrdonnance(1));

    await waitFor(() => expect(result.current.error).toBe("Not found"));
    expect(result.current.data).toBeNull();
  });

  it("should not fetch ordonnance when id is missing", async () => {
    const { result } = renderHook(() => useOrdonnance(0));

    expect(result.current.data).toBeNull();
    expect(ordonnanceService.getById).not.toHaveBeenCalled();
  });

  it("should load ordonnances by patient and support reload", async () => {
    (ordonnanceService.getByPatient as jest.Mock).mockResolvedValue({ content: [ordonnance] });

    const { result } = renderHook(() => useOrdonnancesByPatient(5, 2));

    await waitFor(() => expect(result.current.data).toEqual([ordonnance]));
    await act(async () => result.current.reload());

    expect(ordonnanceService.getByPatient).toHaveBeenCalledWith(5, 2);
    expect(ordonnanceService.getByPatient).toHaveBeenCalledTimes(2);
  });

  it("should create ordonnance and reset loading when mutate succeeds", async () => {
    (ordonnanceService.create as jest.Mock).mockResolvedValue(ordonnance);

    const { result } = renderHook(() => useCreateOrdonnance());
    const response = await act(async () => result.current.mutateAsync({
      consultationId: 1,
      dureeTraitement: "5 jours",
      medicaments: [],
    }));

    expect(response).toEqual(ordonnance);
    expect(result.current.loading).toBe(false);
  });

  it("should cancel ordonnance and reset loading when mutate succeeds", async () => {
    (ordonnanceService.annuler as jest.Mock).mockResolvedValue({ ...ordonnance, statut: "ANNULEE" });

    const { result } = renderHook(() => useAnnulerOrdonnance());
    const response = await act(async () => result.current.mutateAsync(1));

    expect(response.statut).toBe("ANNULEE");
    expect(result.current.loading).toBe(false);
  });
});
