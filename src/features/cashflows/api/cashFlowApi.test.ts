import { describe, it, expect, vi, beforeEach } from "vitest";
import cashFlowApi, { type CashFlowPayload } from "./cashFlowApi";
import apiHelper from "../../../helpers/apiHelper";

const payload: CashFlowPayload = {
  type: "inflow",
  source: "cash",
  label: "gaji",
  nominal: 2500000,
  description: "Gaji bulanan",
};

function mockResponse(body: any) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
    json: async () => body,
  } as any);
}

describe("cashFlowApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("postCashFlow", () => {
    it("should post cash flow as JSON and return data", async () => {
      const spy = mockResponse({ status: "success", data: { cash_flow_id: 10 } });

      const res = await cashFlowApi.postCashFlow(payload);

      expect(res).toEqual({ cash_flow_id: 10 });
      const [url, options] = spy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${DELCOM_BASEURL}/cash-flows/`);
      expect(options.method).toBe("POST");
      expect((options.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
      expect(JSON.parse(options.body as string)).toEqual(payload);
    });

    it("should throw API message when request fails", async () => {
      mockResponse({ status: "fail", message: "Data tidak valid" });
      await expect(cashFlowApi.postCashFlow(payload)).rejects.toThrow("Data tidak valid");
    });

    it("should throw fallback message when API gives no message", async () => {
      mockResponse({ status: "fail" });
      await expect(cashFlowApi.postCashFlow(payload)).rejects.toThrow(
        "Gagal menambahkan catatan arus kas"
      );
    });
  });

  describe("putCashFlow", () => {
    it("should update cash flow and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil mengubah data" });

      const msg = await cashFlowApi.putCashFlow(3, payload);

      expect(msg).toBe("Berhasil mengubah data");
      const [url, options] = spy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${DELCOM_BASEURL}/cash-flows/3`);
      expect(options.method).toBe("PUT");
    });

    it("should throw error when update fails", async () => {
      mockResponse({ status: "fail", message: "Gagal" });
      await expect(cashFlowApi.putCashFlow(3, payload)).rejects.toThrow("Gagal");
    });
  });

  describe("getCashFlows", () => {
    it("should fetch list with stats without filters", async () => {
      const spy = mockResponse({
        status: "success",
        data: {
          cash_flows: [{ id: 1 }],
          stats: { cashflow: 100 },
        },
      });

      const res = await cashFlowApi.getCashFlows();

      expect(res).toEqual({ cashFlows: [{ id: 1 }], stats: { cashflow: 100 } });
      expect((spy.mock.calls[0] as any)[0]).toBe(`${DELCOM_BASEURL}/cash-flows/`);
    });

    it("should send only filled query parameters", async () => {
      const spy = mockResponse({ status: "success", data: { cash_flows: [], stats: {} } });

      await cashFlowApi.getCashFlows({
        type: "inflow",
        source: "",
        label: undefined,
        start_date: "2026-10-01 00:00:00",
        end_date: null as any,
      });

      const url = (spy.mock.calls[0] as any)[0] as string;
      expect(url).toContain("?type=inflow&start_date=2026-10-01+00%3A00%3A00");
      expect(url).not.toContain("source=");
      expect(url).not.toContain("label=");
      expect(url).not.toContain("end_date=");
    });

    it("should fall back to empty values when data is missing", async () => {
      mockResponse({ status: "success" });
      expect(await cashFlowApi.getCashFlows()).toEqual({ cashFlows: [], stats: {} });

      mockResponse({ status: "success", data: {} });
      expect(await cashFlowApi.getCashFlows()).toEqual({ cashFlows: [], stats: {} });
    });

    it("should throw error when request fails", async () => {
      mockResponse({ status: "fail", message: "Unauthenticated." });
      await expect(cashFlowApi.getCashFlows()).rejects.toThrow("Unauthenticated.");
    });
  });

  describe("getCashFlowById", () => {
    it("should return cash flow detail", async () => {
      const spy = mockResponse({ status: "success", data: { cash_flow: { id: 4 } } });

      expect(await cashFlowApi.getCashFlowById(4)).toEqual({ id: 4 });
      expect((spy.mock.calls[0] as any)[0]).toBe(`${DELCOM_BASEURL}/cash-flows/4`);
    });

    it("should return undefined when data is missing", async () => {
      mockResponse({ status: "success" });
      expect(await cashFlowApi.getCashFlowById(4)).toBeUndefined();
    });

    it("should throw error when request fails", async () => {
      mockResponse({ status: "fail", message: "Tidak ditemukan" });
      await expect(cashFlowApi.getCashFlowById(4)).rejects.toThrow("Tidak ditemukan");
    });
  });

  describe("deleteCashFlow", () => {
    it("should delete cash flow and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menghapus data" });

      expect(await cashFlowApi.deleteCashFlow(4)).toBe("Berhasil menghapus data");
      expect((spy.mock.calls[0] as any)[1].method).toBe("DELETE");
    });

    it("should throw error when delete fails", async () => {
      mockResponse({ status: "fail" });
      await expect(cashFlowApi.deleteCashFlow(4)).rejects.toThrow(
        "Gagal menghapus catatan arus kas"
      );
    });
  });

  describe("getLabels", () => {
    it("should return labels", async () => {
      const spy = mockResponse({ status: "success", data: { labels: ["gaji"] } });

      expect(await cashFlowApi.getLabels()).toEqual(["gaji"]);
      expect((spy.mock.calls[0] as any)[0]).toBe(`${DELCOM_BASEURL}/cash-flows/labels`);
    });

    it("should return empty list when labels are missing", async () => {
      mockResponse({ status: "success" });
      expect(await cashFlowApi.getLabels()).toEqual([]);
    });
  });

  describe("stats", () => {
    const series = { stats_inflow: {}, stats_outflow: {}, stats_cashflow: {} };

    it("should fetch daily stats with and without params", async () => {
      const spy = mockResponse({ status: "success", data: series });

      expect(await cashFlowApi.getStatsDaily()).toEqual(series);
      expect((spy.mock.calls[0] as any)[0]).toBe(`${DELCOM_BASEURL}/cash-flows/stats/daily`);

      await cashFlowApi.getStatsDaily({ end_date: "2026-10-08 23:59:59", total_data: 7 });
      expect((spy.mock.calls[1] as any)[0]).toContain("/stats/daily?end_date=");
      expect((spy.mock.calls[1] as any)[0]).toContain("total_data=7");
    });

    it("should fetch monthly stats with and without params", async () => {
      const spy = mockResponse({ status: "success", data: series });

      expect(await cashFlowApi.getStatsMonthly()).toEqual(series);
      expect((spy.mock.calls[0] as any)[0]).toBe(`${DELCOM_BASEURL}/cash-flows/stats/monthly`);

      await cashFlowApi.getStatsMonthly({ total_data: 12 });
      expect((spy.mock.calls[1] as any)[0]).toContain("/stats/monthly?total_data=12");
    });

    it("should throw error when stats request fails", async () => {
      mockResponse({ status: "fail" });
      await expect(cashFlowApi.getStatsDaily()).rejects.toThrow("Gagal mengambil statistik harian");
      await expect(cashFlowApi.getStatsMonthly()).rejects.toThrow(
        "Gagal mengambil statistik bulanan"
      );
    });
  });

  describe("deleteAllCashFlows", () => {
    it("should reset all cash flows", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menghapus semua" });

      expect(await cashFlowApi.deleteAllCashFlows()).toBe("Berhasil menghapus semua");
      expect((spy.mock.calls[0] as any)[1].method).toBe("DELETE");
    });

    it("should throw error when reset fails", async () => {
      mockResponse({ status: "fail" });
      await expect(cashFlowApi.deleteAllCashFlows()).rejects.toThrow(
        "Gagal mereset catatan arus kas"
      );
    });
  });
});
