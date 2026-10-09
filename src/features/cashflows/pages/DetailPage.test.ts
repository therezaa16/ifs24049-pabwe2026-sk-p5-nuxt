import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory } from "vue-router";
import DetailPage from "./DetailPage.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { createAppRouter } from "../../../router";
import * as toolsHelper from "../../../helpers/toolsHelper";

const profile = { id: 1, name: "Eliza", email: "eliza@del.ac.id" };

const inflow = {
  id: 5,
  type: "inflow",
  source: "cash",
  label: "gaji",
  description: "Gaji bulanan",
  nominal: 2500000,
  created_at: "2024-10-05T11:26:45.000000Z",
  updated_at: "2024-10-05T11:26:48.000000Z",
};

const outflow = {
  ...inflow,
  id: 6,
  type: "outflow",
  source: "loans",
  label: "cicilan",
  description: "",
  nominal: 100000,
};

async function setup(state: Record<string, any> = {}, cashFlowId = "5") {
  const router = createAppRouter(createMemoryHistory());
  router.push(`/cash-flows/${cashFlowId}`);
  await router.isReady();
  const pushSpy = vi.spyOn(router, "push");

  const { pinia, cashFlowsStore } = createMockPinia({ profile, cashFlow: inflow, ...state });
  const detailSpy = vi.spyOn(cashFlowsStore, "asyncSetCashFlow").mockResolvedValue(undefined);
  const result = renderWithProviders(DetailPage, { pinia, router });
  return { ...result, cashFlowsStore, detailSpy, pushSpy };
}

describe("DetailPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch detail by route id on mount", async () => {
    const { detailSpy } = await setup();
    expect(detailSpy).toHaveBeenCalledWith("5");
  });

  it("should show loading state when cash flow or profile is missing", async () => {
    const { wrapper } = await setup({ cashFlow: null });
    expect(wrapper.text()).toContain("Memuat detail transaksi...");

    const { wrapper: noProfile } = await setup({ profile: null });
    expect(noProfile.text()).toContain("Memuat detail transaksi...");
  });

  it("should render inflow detail", async () => {
    const { wrapper } = await setup();
    const money = wrapper.find('[data-testid="detail-nominal"]');

    expect(wrapper.find("h1").text()).toBe("gaji");
    expect(wrapper.find('[data-testid="detail-type-badge"]').text()).toBe("Pemasukan");
    expect(money.text().replace(/\s/g, " ")).toBe("Rp 2.500.000");
    expect(money.classes()).toContain("text-emerald-800");
    expect(wrapper.text()).toContain("Tunai");
    expect(wrapper.find('[data-testid="cash-flow-detail-description"]').text()).toBe("Gaji bulanan");
  });

  it("should render outflow detail with fallback description", async () => {
    const { wrapper } = await setup({ cashFlow: outflow }, "6");

    expect(wrapper.find('[data-testid="detail-type-badge"]').text()).toBe("Pengeluaran");
    expect(wrapper.find('[data-testid="detail-nominal"]').classes()).toContain("text-red-800");
    expect(wrapper.text()).toContain("Pinjaman");
    expect(wrapper.find('[data-testid="cash-flow-detail-description"]').text()).toBe(
      "Tidak ada keterangan untuk transaksi ini."
    );
  });

  it("should fetch again when route id changes", async () => {
    const { router, detailSpy } = await setup();
    detailSpy.mockClear();

    await router.push("/cash-flows/9");
    await flushPromises();

    expect(detailSpy).toHaveBeenCalledWith("9");
  });

  it("should not fetch when route id becomes empty", async () => {
    const { router, detailSpy } = await setup();
    detailSpy.mockClear();

    await router.push("/");
    await flushPromises();

    expect(detailSpy).not.toHaveBeenCalled();
  });

  it("should redirect home when detail could not be loaded", async () => {
    const { cashFlowsStore, pushSpy } = await setup({ cashFlow: null });

    cashFlowsStore.setIsCashFlow(true);
    await flushPromises();

    expect(cashFlowsStore.isCashFlow).toBe(false);
    expect(pushSpy).toHaveBeenCalledWith("/");
  });

  it("should stay on page when detail loaded successfully", async () => {
    const { cashFlowsStore, pushSpy } = await setup();

    cashFlowsStore.setIsCashFlow(true);
    await flushPromises();

    expect(cashFlowsStore.isCashFlow).toBe(false);
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it("should open and close edit modal, and reload after saved", async () => {
    const { wrapper, detailSpy } = await setup();
    detailSpy.mockClear();

    await wrapper.find('[data-testid="edit-detail-cash-flow-btn"]').trigger("click");
    expect(wrapper.findComponent(ChangeModal).props("show")).toBe(true);
    expect(wrapper.findComponent(ChangeModal).props("cashFlowId")).toBe(5);

    detailSpy.mockClear();
    wrapper.findComponent(ChangeModal).vm.$emit("saved");
    expect(detailSpy).toHaveBeenCalledWith("5");

    wrapper.findComponent(ChangeModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.findComponent(ChangeModal).props("show")).toBe(false);
  });

  it("should delete only after confirmation and redirect after deleted", async () => {
    const { wrapper, cashFlowsStore, pushSpy } = await setup();
    const deleteSpy = vi
      .spyOn(cashFlowsStore, "asyncSetIsCashFlowDelete")
      .mockResolvedValue(undefined);
    vi.spyOn(toolsHelper, "showConfirmDialog")
      .mockResolvedValueOnce({ isConfirmed: false } as any)
      .mockResolvedValueOnce({ isConfirmed: true } as any);

    await wrapper.find('[data-testid="delete-detail-cash-flow-btn"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).not.toHaveBeenCalled();

    await wrapper.find('[data-testid="delete-detail-cash-flow-btn"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).toHaveBeenCalledWith("5");

    cashFlowsStore.setIsCashFlowDeleted(true);
    await flushPromises();
    expect(cashFlowsStore.isCashFlowDeleted).toBe(false);
    expect(pushSpy).toHaveBeenCalledWith("/");

    pushSpy.mockClear();
    cashFlowsStore.setIsCashFlowDeleted(false);
    await flushPromises();
    expect(pushSpy).not.toHaveBeenCalled();
  });
});
