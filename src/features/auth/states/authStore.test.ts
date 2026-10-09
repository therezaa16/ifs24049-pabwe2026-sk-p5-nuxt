import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "./authStore";
import authApi from "../api/authApi";
import apiHelper from "../../../helpers/apiHelper";
import * as toolsHelper from "../../../helpers/toolsHelper";

vi.mock("../api/authApi");
vi.mock("../../../helpers/apiHelper", () => ({
  default: {
    putAccessToken: vi.fn(),
  },
}));
vi.mock("../../../helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}));

describe("authStore", () => {
  let store: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAuthStore();
    vi.clearAllMocks();
  });

  it("should have correct initial state", () => {
    expect(store.isAuthRegister).toBe(false);
    expect(store.isAuthRegistered).toBe(false);
    expect(store.isAuthLogin).toBe(false);
    expect(store.isAuthLoggedIn).toBe(false);
    expect(store.isAuthLogout).toBe(false);
    expect(store.isAuthLoggedOut).toBe(false);
  });

  it("should update state with setters", () => {
    store.setIsAuthRegister(true);
    expect(store.isAuthRegister).toBe(true);

    store.setIsAuthRegistered(true);
    expect(store.isAuthRegistered).toBe(true);

    store.setIsAuthLogin(true);
    expect(store.isAuthLogin).toBe(true);

    store.setIsAuthLoggedIn(true);
    expect(store.isAuthLoggedIn).toBe(true);

    store.setIsAuthLogout(true);
    expect(store.isAuthLogout).toBe(true);

    store.setIsAuthLoggedOut(true);
    expect(store.isAuthLoggedOut).toBe(true);
  });

  describe("asyncSetIsAuthRegister", () => {
    it("should succeed and show success dialog", async () => {
      vi.mocked(authApi.postRegister).mockResolvedValueOnce("Pendaftaran berhasil");

      await store.asyncSetIsAuthRegister("Budi", "budi@del.org", "pwd");

      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith("Pendaftaran berhasil");
      expect(store.isAuthRegistered).toBe(true);
      expect(store.isAuthRegister).toBe(true);
    });

    it("should fail and show error dialog", async () => {
      vi.mocked(authApi.postRegister).mockRejectedValueOnce(new Error("Email sudah terdaftar"));

      await store.asyncSetIsAuthRegister("Budi", "budi@del.org", "pwd");

      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Email sudah terdaftar");
      expect(store.isAuthRegistered).toBe(false);
      expect(store.isAuthRegister).toBe(true);
    });
  });

  describe("asyncSetIsAuthLogin", () => {
    it("should login successfully and save token", async () => {
      vi.mocked(authApi.postLogin).mockResolvedValueOnce({
        token: "jwt-token-xyz",
        user: { id: 1 },
      });

      await store.asyncSetIsAuthLogin("budi@del.org", "pwd");

      expect(apiHelper.putAccessToken).toHaveBeenCalledWith("jwt-token-xyz");
      expect(store.isAuthLoggedIn).toBe(true);
      expect(store.isAuthLogin).toBe(true);
    });

    it("should fail to login and show error dialog", async () => {
      vi.mocked(authApi.postLogin).mockRejectedValueOnce(new Error("Email atau password salah"));

      await store.asyncSetIsAuthLogin("budi@del.org", "wrong");

      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Email atau password salah");
      expect(store.isAuthLoggedIn).toBe(false);
      expect(store.isAuthLogin).toBe(true);
    });
  });

  describe("asyncSetIsAuthLogout", () => {
    it("should clear token and mark logged out even when backend call resolves", async () => {
      vi.mocked(authApi.postLogout).mockResolvedValueOnce("Logout sukses");

      await store.asyncSetIsAuthLogout();

      expect(apiHelper.putAccessToken).toHaveBeenCalledWith("");
      expect(store.isAuthLoggedOut).toBe(true);
      expect(store.isAuthLogout).toBe(true);
    });

    it("should clear token and mark logged out even when backend call rejects", async () => {
      vi.mocked(authApi.postLogout).mockRejectedValueOnce(new Error("Network error"));

      await store.asyncSetIsAuthLogout();

      expect(apiHelper.putAccessToken).toHaveBeenCalledWith("");
      expect(store.isAuthLoggedOut).toBe(true);
      expect(store.isAuthLogout).toBe(true);
    });
  });
});
