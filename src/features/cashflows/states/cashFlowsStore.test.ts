import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useCashFlowsStore } from "./cashFlowsStore";
import cashFlowApi, { type CashFlow, type CashFlowPayload } from "../api/cashFlowApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

const dummy: CashFlow = {
  id: 1,
  type: "inflow",
  source: "cash",
  label: "gaji",
  description: "Gaji bulanan",
  nominal: 1000,
};

const payload: CashFlowPayload = {
  type: "inflow",
  source: "cash",
  label: "gaji",
  nominal: 1000,
  description: "Gaji bulanan",
};

describe("cashFlowsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => Promise.resolve({} as any));
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({} as any));
  });

  it("should have correct default state", () => {
    const store = useCashFlowsStore();
    expect(store.cashFlows).toEqual([]);
    expect(store.cashFlow).toBeNull();
    expect(store.stats).toEqual({});
    expect(store.labels).toEqual([]);
    expect(store.statsDaily).toBeNull();
    expect(store.statsMonthly).toBeNull();
    expect(store.isCashFlow).toBe(false);
    expect(store.isCashFlowAdd).toBe(false);
    expect(store.isCashFlowAdded).toBe(false);
    expect(store.isCashFlowChange).toBe(false);
    expect(store.isCashFlowChanged).toBe(false);
    expect(store.isCashFlowDelete).toBe(false);
    expect(store.isCashFlowDeleted).toBe(false);
    expect(store.isCashFlowDeleteAll).toBe(false);
    expect(store.isCashFlowDeletedAll).toBe(false);
  });

  it("should update state with setters", () => {
    const store = useCashFlowsStore();
    const series = { stats_inflow: {}, stats_outflow: {}, stats_cashflow: {} };

    store.setCashFlows([dummy]);
    store.setCashFlow(dummy);
    store.setStats({ cashflow: 5 });
    store.setLabels(["gaji"]);
    store.setStatsDaily(series);
    store.setStatsMonthly(series);
    store.setIsCashFlow(true);
    store.setIsCashFlowAdd(true);
    store.setIsCashFlowAdded(true);
    store.setIsCashFlowChange(true);
    store.setIsCashFlowChanged(true);
    store.setIsCashFlowDelete(true);
    store.setIsCashFlowDeleted(true);
    store.setIsCashFlowDeleteAll(true);
    store.setIsCashFlowDeletedAll(true);

    expect(store.cashFlows).toEqual([dummy]);
    expect(store.cashFlow).toEqual(dummy);
    expect(store.stats).toEqual({ cashflow: 5 });
    expect(store.labels).toEqual(["gaji"]);
    expect(store.statsDaily).toEqual(series);
    expect(store.statsMonthly).toEqual(series);
    expect(store.isCashFlow).toBe(true);
    expect(store.isCashFlowAdd).toBe(true);
    expect(store.isCashFlowAdded).toBe(true);
    expect(store.isCashFlowChange).toBe(true);
    expect(store.isCashFlowChanged).toBe(true);
    expect(store.isCashFlowDelete).toBe(true);
    expect(store.isCashFlowDeleted).toBe(true);
    expect(store.isCashFlowDeleteAll).toBe(true);
    expect(store.isCashFlowDeletedAll).toBe(true);
  });

  describe("asyncSetCashFlows", () => {
    it("should set cash flows and stats on success", async () => {
      const store = useCashFlowsStore();
      const spy = vi
        .spyOn(cashFlowApi, "getCashFlows")
        .mockResolvedValue({ cashFlows: [dummy], stats: { cashflow: 1000 } });

      await store.asyncSetCashFlows({ type: "inflow" });

      expect(spy).toHaveBeenCalledWith({ type: "inflow" });
      expect(store.cashFlows).toEqual([dummy]);
      expect(store.stats).toEqual({ cashflow: 1000 });
    });

    it("should use default params and reset data on failure", async () => {
      const store = useCashFlowsStore();
      store.setCashFlows([dummy]);
      store.setStats({ cashflow: 1 });
      const spy = vi.spyOn(cashFlowApi, "getCashFlows").mockRejectedValue(new Error("x"));

      await store.asyncSetCashFlows();

      expect(spy).toHaveBeenCalledWith({});
      expect(store.cashFlows).toEqual([]);
      expect(store.stats).toEqual({});
    });
  });

  describe("asyncSetCashFlow", () => {
    it("should set detail and mark loaded", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "getCashFlowById").mockResolvedValue(dummy);

      await store.asyncSetCashFlow(1);

      expect(store.cashFlow).toEqual(dummy);
      expect(store.isCashFlow).toBe(true);
    });

    it("should set null on failure and still mark loaded", async () => {
      const store = useCashFlowsStore();
      store.setCashFlow(dummy);
      vi.spyOn(cashFlowApi, "getCashFlowById").mockRejectedValue(new Error("x"));

      await store.asyncSetCashFlow(1);

      expect(store.cashFlow).toBeNull();
      expect(store.isCashFlow).toBe(true);
    });
  });

  describe("asyncSetLabels", () => {
    it("should set labels", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "getLabels").mockResolvedValue(["gaji"]);
      await store.asyncSetLabels();
      expect(store.labels).toEqual(["gaji"]);
    });

    it("should reset labels on failure", async () => {
      const store = useCashFlowsStore();
      store.setLabels(["gaji"]);
      vi.spyOn(cashFlowApi, "getLabels").mockRejectedValue(new Error("x"));
      await store.asyncSetLabels();
      expect(store.labels).toEqual([]);
    });
  });

  describe("stats actions", () => {
    const series = { stats_inflow: { a: 1 }, stats_outflow: {}, stats_cashflow: {} };

    it("should set daily and monthly stats", async () => {
      const store = useCashFlowsStore();
      const daily = vi.spyOn(cashFlowApi, "getStatsDaily").mockResolvedValue(series);
      const monthly = vi.spyOn(cashFlowApi, "getStatsMonthly").mockResolvedValue(series);

      await store.asyncSetStatsDaily();
      await store.asyncSetStatsMonthly({ total_data: 12 });

      expect(daily).toHaveBeenCalledWith({});
      expect(monthly).toHaveBeenCalledWith({ total_data: 12 });
      expect(store.statsDaily).toEqual(series);
      expect(store.statsMonthly).toEqual(series);
    });

    it("should reset stats on failure", async () => {
      const store = useCashFlowsStore();
      store.setStatsDaily(series);
      store.setStatsMonthly(series);
      vi.spyOn(cashFlowApi, "getStatsDaily").mockRejectedValue(new Error("x"));
      vi.spyOn(cashFlowApi, "getStatsMonthly").mockRejectedValue(new Error("x"));

      await store.asyncSetStatsDaily({ total_data: 3 });
      await store.asyncSetStatsMonthly();

      expect(store.statsDaily).toBeNull();
      expect(store.statsMonthly).toBeNull();
    });
  });

  describe("asyncSetIsCashFlowAdd", () => {
    it("should flag success and show dialog", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "postCashFlow").mockResolvedValue({ cash_flow_id: 1 });

      await store.asyncSetIsCashFlowAdd(payload);

      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith(
        "Catatan arus kas berhasil ditambahkan!"
      );
      expect(store.isCashFlowAdded).toBe(true);
      expect(store.isCashFlowAdd).toBe(true);
    });

    it("should flag failure and show error", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "postCashFlow").mockRejectedValue(new Error("Gagal"));

      await store.asyncSetIsCashFlowAdd(payload);

      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Gagal");
      expect(store.isCashFlowAdded).toBe(false);
      expect(store.isCashFlowAdd).toBe(true);
    });
  });

  describe("asyncSetIsCashFlowChange", () => {
    it("should use API message on success", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "putCashFlow").mockResolvedValue("Berhasil ubah");

      await store.asyncSetIsCashFlowChange(1, payload);

      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith("Berhasil ubah");
      expect(store.isCashFlowChanged).toBe(true);
      expect(store.isCashFlowChange).toBe(true);
    });

    it("should use fallback message when API message is empty", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "putCashFlow").mockResolvedValue("");

      await store.asyncSetIsCashFlowChange(1, payload);

      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith(
        "Catatan arus kas berhasil diperbarui!"
      );
    });

    it("should flag failure", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "putCashFlow").mockRejectedValue(new Error("Gagal ubah"));

      await store.asyncSetIsCashFlowChange(1, payload);

      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Gagal ubah");
      expect(store.isCashFlowChanged).toBe(false);
      expect(store.isCashFlowChange).toBe(true);
    });
  });

  describe("asyncSetIsCashFlowDelete", () => {
    it("should use API message on success", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteCashFlow").mockResolvedValue("Terhapus");

      await store.asyncSetIsCashFlowDelete(1);

      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith("Terhapus");
      expect(store.isCashFlowDeleted).toBe(true);
      expect(store.isCashFlowDelete).toBe(true);
    });

    it("should use fallback message when API message is empty", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteCashFlow").mockResolvedValue("");

      await store.asyncSetIsCashFlowDelete(1);

      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith(
        "Catatan arus kas berhasil dihapus!"
      );
    });

    it("should flag failure", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteCashFlow").mockRejectedValue(new Error("Gagal hapus"));

      await store.asyncSetIsCashFlowDelete(1);

      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Gagal hapus");
      expect(store.isCashFlowDeleted).toBe(false);
      expect(store.isCashFlowDelete).toBe(true);
    });
  });

  describe("asyncSetIsCashFlowDeleteAll", () => {
    it("should use API message on success", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteAllCashFlows").mockResolvedValue("Semua terhapus");

      await store.asyncSetIsCashFlowDeleteAll();

      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith("Semua terhapus");
      expect(store.isCashFlowDeletedAll).toBe(true);
      expect(store.isCashFlowDeleteAll).toBe(true);
    });

    it("should use fallback message when API message is empty", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteAllCashFlows").mockResolvedValue("");

      await store.asyncSetIsCashFlowDeleteAll();

      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith(
        "Seluruh catatan arus kas berhasil dihapus!"
      );
    });

    it("should flag failure", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteAllCashFlows").mockRejectedValue(new Error("Gagal reset"));

      await store.asyncSetIsCashFlowDeleteAll();

      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Gagal reset");
      expect(store.isCashFlowDeletedAll).toBe(false);
      expect(store.isCashFlowDeleteAll).toBe(true);
    });
  });
});
