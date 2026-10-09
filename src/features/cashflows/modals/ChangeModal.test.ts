import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.vue";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));

const existing = {
  id: 7,
  type: "outflow",
  source: "savings",
  label: "alat-elektronik",
  description: "Membeli keyboard",
  nominal: 400000,
};

function setup(props: Record<string, any>, state: Record<string, any> = {}) {
  const { pinia, cashFlowsStore } = createMockPinia(state);
  const fetchSpy = vi.spyOn(cashFlowsStore, "asyncSetCashFlow").mockResolvedValue(undefined);
  const result = renderWithProviders(ChangeModal, { pinia, props });
  return { ...result, fetchSpy };
}

describe("ChangeModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({} as any));
  });

  it("should not render when show is false and not fetch data", () => {
    const { wrapper, fetchSpy } = setup({ show: false, cashFlowId: 7 }, { cashFlow: existing });
    expect(wrapper.find('[data-testid="change-cash-flow-modal"]').exists()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should not fetch when id is missing even though modal is shown", () => {
    const { fetchSpy } = setup({ show: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should fetch and fill the form with stored cash flow when shown", async () => {
    const { wrapper, fetchSpy } = setup({ show: true, cashFlowId: 7 }, { cashFlow: existing });

    expect(fetchSpy).toHaveBeenCalledWith(7);
    const val = (id: string) =>
      (wrapper.find(`[data-testid="${id}"]`).element as HTMLInputElement).value;
    expect(val("change-cash-flow-type-input")).toBe("outflow");
    expect(val("change-cash-flow-source-input")).toBe("savings");
    expect(val("change-cash-flow-label-input")).toBe("alat-elektronik");
    expect(val("change-cash-flow-nominal-input")).toBe("400000");
    expect(val("change-cash-flow-description-input")).toBe("Membeli keyboard");
  });

  it("should fetch when modal becomes visible after mount", async () => {
    const { wrapper, fetchSpy } = setup({ show: false, cashFlowId: 7 });

    await wrapper.setProps({ show: true });

    expect(fetchSpy).toHaveBeenCalledWith(7);
    expect(document.body.style.overflow).toBe("hidden");

    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should leave form untouched when no cash flow is stored", () => {
    const { wrapper } = setup({ show: true, cashFlowId: 7 });
    expect(
      (wrapper.find('[data-testid="change-cash-flow-label-input"]').element as HTMLInputElement).value
    ).toBe("");
  });

  it("should validate label, nominal and description", async () => {
    const { wrapper } = setup({ show: true, cashFlowId: 7 }, { cashFlow: existing });
    const label = wrapper.find('[data-testid="change-cash-flow-label-input"]');
    const nominal = wrapper.find('[data-testid="change-cash-flow-nominal-input"]');
    const description = wrapper.find('[data-testid="change-cash-flow-description-input"]');

    await label.setValue("  ");
    await wrapper.find("form").trigger("submit");
    expect(toolsHelper.showErrorDialog).toHaveBeenLastCalledWith("Label tidak boleh kosong");

    await label.setValue("gaji");
    await nominal.setValue("0");
    await wrapper.find("form").trigger("submit");
    expect(toolsHelper.showErrorDialog).toHaveBeenLastCalledWith("Nominal harus lebih besar dari 0");

    await nominal.setValue("1000");
    await description.setValue("   ");
    await wrapper.find("form").trigger("submit");
    expect(toolsHelper.showErrorDialog).toHaveBeenLastCalledWith("Keterangan tidak boleh kosong");
  });

  it("should submit changes and emit saved and close on success", async () => {
    const { wrapper, cashFlowsStore } = setup({ show: true, cashFlowId: 7 }, { cashFlow: existing });
    const changeSpy = vi
      .spyOn(cashFlowsStore, "asyncSetIsCashFlowChange")
      .mockReturnValue(Promise.resolve());

    await wrapper.find('[data-testid="change-cash-flow-type-input"]').setValue("inflow");
    await wrapper.find('[data-testid="change-cash-flow-source-input"]').setValue("loans");
    await wrapper.find('[data-testid="change-cash-flow-nominal-input"]').setValue("500000");
    await wrapper.find("form").trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(7, {
      type: "inflow",
      source: "loans",
      label: "alat-elektronik",
      nominal: 500000,
      description: "Membeli keyboard",
    });
    expect(wrapper.text()).toContain("Menyimpan...");

    cashFlowsStore.setIsCashFlowChange(true);
    cashFlowsStore.setIsCashFlowChanged(true);
    await tick();

    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(cashFlowsStore.isCashFlowChange).toBe(false);
    expect(cashFlowsStore.isCashFlowChanged).toBe(false);
  });

  it("should stay open when change failed", async () => {
    const { wrapper, cashFlowsStore } = setup({ show: true, cashFlowId: 7 }, { cashFlow: existing });
    vi.spyOn(cashFlowsStore, "asyncSetIsCashFlowChange").mockReturnValue(Promise.resolve());

    await wrapper.find("form").trigger("submit");
    cashFlowsStore.setIsCashFlowChange(true);
    cashFlowsStore.setIsCashFlowChanged(false);
    await tick();

    expect(wrapper.emitted("close")).toBeUndefined();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should ignore changed flag when no change action finished", async () => {
    const { wrapper, cashFlowsStore } = setup({ show: true, cashFlowId: 7 }, { cashFlow: existing });
    cashFlowsStore.setIsCashFlowChanged(true);
    await tick();
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("should emit close from close and cancel buttons", async () => {
    const { wrapper } = setup({ show: true, cashFlowId: 7 }, { cashFlow: existing });

    await wrapper.find('[data-testid="close-change-modal-btn"]').trigger("click");
    await wrapper.find('[data-testid="cancel-change-modal-btn"]').trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(2);
  });
});
