import {
  ApiError,
  cancelMyRendezVous,
  downloadOrdonnancePdf,
  getPatients,
  getUnreadCount,
  login,
} from "@/lib/api";

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  localStorage.clear();
});

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
    blob: jest.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })),
  } as unknown as Response;
}

describe("api client", () => {
  it("should post login credentials and unwrap data when login succeeds", async () => {
    const auth = {
      token: "token-123",
      type: "Bearer",
      email: "patient@mail.com",
      role: "PATIENT",
      passwordChanged: true,
    };
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: auth }));

    await expect(login("patient@mail.com", "secret")).resolves.toEqual(auth);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "patient@mail.com", password: "secret" }),
      })
    );
  });

  it("should attach bearer token and query parameters when getting patients", async () => {
    localStorage.setItem("rahma_auth_user", JSON.stringify({ token: "abc" }));
    const page = { content: [], totalElements: 0 };
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: page }));

    await expect(getPatients(2, 25, "doe")).resolves.toBe(page);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/patients?page=2&size=25&search=doe");
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer abc");
    expect((options.headers as Headers).get("Content-Type")).toBe("application/json");
  });

  it("should throw api error when login receives unauthorized response", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Bad credentials" }, false, 401));

    await expect(login("bad@mail.com", "wrong")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Bad credentials",
    });
  });

  it("should return friendly rate-limit message when backend returns 429", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Too many" }, false, 429));

    await expect(cancelMyRendezVous(8)).rejects.toEqual(
      new ApiError("Trop de tentatives — réessayez dans 1 minute", 429)
    );
  });

  it("should extract unread count when notification count endpoint returns count object", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { count: 4 } }));

    await expect(getUnreadCount()).resolves.toBe(4);
  });

  it("should create and click download link when ordonnance pdf is downloaded", async () => {
    localStorage.setItem("rahma_auth_user", JSON.stringify({ token: "abc" }));
    fetchMock.mockResolvedValueOnce(jsonResponse({}, true, 200));
    const createObjectURL = jest.fn(() => "blob:ordonnance");
    const revokeObjectURL = jest.fn();
    Object.defineProperty(window.URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(window.URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    await downloadOrdonnancePdf(12, "Doe");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/ordonnances/12/pdf",
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:ordonnance");
  });
});
