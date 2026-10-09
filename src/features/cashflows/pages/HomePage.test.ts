import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import HomePage from "./HomePage.vue";
import AddModal from "../modals/AddModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const mockRouter = { push: vi.fn() };

vi.mock("vue-router", async () => {
  const actual = await vi.importActual("vue-router");
  return { ...actual, useRouter: () => mockRouter };
});

const profile = { id: 1, name: "Eliza", email: "eliza@del.ac.id" };

const cashFlows = [
  {
    id: 1,
    type: "inflow",
    source: "cash",
    label: "gaji",
    description: "Gaji bulanan",
    nominal: 2500000,
    created_at: "2024-10-05T11:26:45.000000Z",
  },
  {
    id: 2,
    type: "outflow",
    source: "savings",
    label: "alat-elektronik",
    description: "Keyboard dan mouse",
    nominal: 400000,
    created_at: "2024-10-05T12:09:16.000000Z",
  },
];

const stats = {
  cashflow: 2100000,
  total_inflow: 2500000,
  total_outflow: 400000,
  total_inflow_cash: 2500000,
  total_outflow_cash: 0,
  total_inflow_savings: 0,
  total_outflow_savings: 400000,
  total_inflow_loans: 100000,
  total_outflow_loans: 30000,
};

function setup(state: Record<string, any> = {}, withProfile = true) {
  const { pinia, cashFlowsStore, usersStore } = createMockPinia({
    profile: withProfile ? profile : null,
    cashFlows,
    stats,
    labels: ["gaji", "alat-elektronik"],
    ...state,
  });
  const listSpy = vi.spyOn(cashFlowsStore, "asyncSetCashFlows").mockResolvedValue(undefined);
  const labelsSpy = vi.spyOn(cashFlowsStore, "asyncSetLabels").mockResolvedValue(undefined);
  const detailSpy = vi.spyOn(cashFlowsStore, "asyncSetCashFlow").mockResolvedValue(undefined);
  const result = renderWithProviders(HomePage, { pinia });
  return { ...result, cashFlowsStore, usersStore, listSpy, labelsSpy, detailSpy };
}

const rupiah = (n: number) => toolsHelper.formatRupiah(n).replace(/\s/g, " ");
const text = (wrapper: any, id: string) => wrapper.find(`[data-testid="${id}"]`).text().replace(/\s/g, " ");

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("should render nothing while profile is not loaded", () => {
    const { wrapper } = setup({}, false);
    expect(wrapper.find("h1").exists()).toBe(false);
  });

  it("should load cash flows and labels on mount without filters", async () => {
    const { listSpy, labelsSpy } = setup();
    await flushPromises();

    expect(labelsSpy).toHaveBeenCalledTimes(1);
    expect(listSpy).toHaveBeenCalledWith({
      type: "",
      source: "",
      label: "",
      start_date: "",
      end_date: "",
    });
  });

  it("should render financial summary cards", () => {
    const { wrapper } = setup();

    expect(text(wrapper, "summary-balance")).toContain(rupiah(2100000));
    expect(text(wrapper, "summary-inflow")).toContain(rupiah(2500000));
    expect(text(wrapper, "summary-outflow")).toContain(rupiah(400000));
    expect(text(wrapper, "summary-cash")).toContain(rupiah(2500000));
    expect(text(wrapper, "summary-savings")).toContain(rupiah(-400000));
    expect(text(wrapper, "summary-loans")).toContain(rupiah(70000));
  });

  it("should show zero balances when stats are empty", () => {
    const { wrapper } = setup({ stats: {} });
    expect(text(wrapper, "summary-balance")).toContain(rupiah(0));
    expect(text(wrapper, "summary-loans")).toContain(rupiah(0));
  });

  it("should render transactions as table rows and cards with type badges", () => {
    const { wrapper } = setup();

    const row1 = wrapper.find('[data-testid="cash-flow-row-1"]');
    const row2 = wrapper.find('[data-testid="cash-flow-row-2"]');
    expect(row1.text()).toContain("gaji");
    expect(row1.text()).toContain("Pemasukan");
    expect(row1.text()).toContain("Tunai");
    expect(row2.text()).toContain("Pengeluaran");
    expect(row2.text()).toContain("Tabungan");
    expect(row2.find("td:nth-child(4)").classes()).toContain("text-red-800");

    expect(wrapper.find('[data-testid="cash-flow-card-1"]').text()).toContain("Pemasukan");
    expect(wrapper.find('[data-testid="cash-flow-card-2"]').text()).toContain("Pengeluaran");
  });

  it("should show loading state while list is empty and request pending", async () => {
    const { pinia, cashFlowsStore } = createMockPinia({ profile, cashFlows: [] });
    vi.spyOn(cashFlowsStore, "asyncSetLabels").mockResolvedValue(undefined);
    let resolve: () => void = () => {};
    vi.spyOn(cashFlowsStore, "asyncSetCashFlows").mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      })
    );
    const { wrapper } = renderWithProviders(HomePage, { pinia });
    await flushPromises();

    expect(wrapper.text()).toContain("Memuat daftar transaksi...");

    resolve();
    await flushPromises();
    expect(wrapper.text()).toContain("Belum ada transaksi yang cocok.");
  });

  it("should reload with converted filter params and clear them", async () => {
    const { wrapper, listSpy } = setup();
    await flushPromises();
    listSpy.mockClear();

    await wrapper.find('[data-testid="filter-type-select"]').setValue("inflow");
    await wrapper.find('[data-testid="filter-source-select"]').setValue("cash");
    await wrapper.find('[data-testid="filter-label-select"]').setValue("gaji");
    await wrapper.find('[data-testid="filter-start-date-input"]').setValue("2026-10-01");
    await wrapper.find('[data-testid="filter-end-date-input"]').setValue("2026-10-08");
    await flushPromises();

    expect(listSpy).toHaveBeenLastCalledWith({
      type: "inflow",
      source: "cash",
      label: "gaji",
      start_date: "2026-10-01 00:00:00",
      end_date: "2026-10-08 23:59:59",
    });

    await wrapper.find('[data-testid="clear-filter-btn"]').trigger("click");
    await flushPromises();

    expect(listSpy).toHaveBeenLastCalledWith({
      type: "",
      source: "",
      label: "",
      start_date: "",
      end_date: "",
    });
  });

  it("should navigate to detail from table and card buttons", async () => {
    const { wrapper } = setup();

    await wrapper.find('[data-testid="view-cash-flow-1"]').trigger("click");
    expect(mockRouter.push).toHaveBeenLastCalledWith("/cash-flows/1");

    await wrapper.find('[data-testid="card-view-cash-flow-2"]').trigger("click");
    expect(mockRouter.push).toHaveBeenLastCalledWith("/cash-flows/2");
  });

  it("should open add modal and reload data when saved", async () => {
    const { wrapper, listSpy, labelsSpy } = setup();
    await flushPromises();

    expect(wrapper.findComponent(AddModal).props("show")).toBe(false);
    await wrapper.find('[data-testid="add-cash-flow-btn"]').trigger("click");
    expect(wrapper.findComponent(AddModal).props("show")).toBe(true);

    listSpy.mockClear();
    labelsSpy.mockClear();
    wrapper.findComponent(AddModal).vm.$emit("saved");
    await flushPromises();
    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(labelsSpy).toHaveBeenCalledTimes(1);

    wrapper.findComponent(AddModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.findComponent(AddModal).props("show")).toBe(false);
  });

  it("should open change modal from table and card buttons", async () => {
    const { wrapper, listSpy } = setup();
    await flushPromises();

    await wrapper.find('[data-testid="edit-cash-flow-1"]').trigger("click");
    expect(wrapper.findComponent(ChangeModal).props("show")).toBe(true);
    expect(wrapper.findComponent(ChangeModal).props("cashFlowId")).toBe(1);

    wrapper.findComponent(ChangeModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.findComponent(ChangeModal).props("show")).toBe(false);

    await wrapper.find('[data-testid="card-edit-cash-flow-2"]').trigger("click");
    expect(wrapper.findComponent(ChangeModal).props("cashFlowId")).toBe(2);

    listSpy.mockClear();
    wrapper.findComponent(ChangeModal).vm.$emit("saved");
    await flushPromises();
    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it("should delete a cash flow only after confirmation", async () => {
    const { wrapper, cashFlowsStore } = setup();
    const deleteSpy = vi
      .spyOn(cashFlowsStore, "asyncSetIsCashFlowDelete")
      .mockResolvedValue(undefined);
    const confirmSpy = vi
      .spyOn(toolsHelper, "showConfirmDialog")
      .mockResolvedValueOnce({ isConfirmed: false } as any)
      .mockResolvedValueOnce({ isConfirmed: true } as any)
      .mockResolvedValueOnce({ isConfirmed: true } as any);

    await wrapper.find('[data-testid="delete-cash-flow-1"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).not.toHaveBeenCalled();

    await wrapper.find('[data-testid="delete-cash-flow-1"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).toHaveBeenCalledWith(1);

    await wrapper.find('[data-testid="card-delete-cash-flow-2"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).toHaveBeenCalledWith(2);
    expect(confirmSpy).toHaveBeenCalledTimes(3);
  });

  it("should reset all cash flows only after confirmation", async () => {
    const { wrapper, cashFlowsStore } = setup();
    const resetSpy = vi
      .spyOn(cashFlowsStore, "asyncSetIsCashFlowDeleteAll")
      .mockResolvedValue(undefined);
    vi.spyOn(toolsHelper, "showConfirmDialog")
      .mockResolvedValueOnce({ isConfirmed: false } as any)
      .mockResolvedValueOnce({ isConfirmed: true } as any);

    await wrapper.find('[data-testid="reset-cash-flows-btn"]').trigger("click");
    await flushPromises();
    expect(resetSpy).not.toHaveBeenCalled();

    await wrapper.find('[data-testid="reset-cash-flows-btn"]').trigger("click");
    await flushPromises();
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });

  it("should reload data after a cash flow is deleted", async () => {
    const { cashFlowsStore, listSpy } = setup();
    await flushPromises();
    listSpy.mockClear();

    cashFlowsStore.setIsCashFlowDeleted(true);
    await flushPromises();

    expect(cashFlowsStore.isCashFlowDeleted).toBe(false);
    expect(listSpy).toHaveBeenCalledTimes(1);

    cashFlowsStore.setIsCashFlowDeleted(false);
    await flushPromises();
    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it("should reload data after all cash flows are reset", async () => {
    const { cashFlowsStore, listSpy } = setup();
    await flushPromises();
    listSpy.mockClear();

    cashFlowsStore.setIsCashFlowDeletedAll(true);
    await flushPromises();

    expect(cashFlowsStore.isCashFlowDeletedAll).toBe(false);
    expect(listSpy).toHaveBeenCalledTimes(1);

    cashFlowsStore.setIsCashFlowDeletedAll(false);
    await flushPromises();
    expect(listSpy).toHaveBeenCalledTimes(1);
  });
});
