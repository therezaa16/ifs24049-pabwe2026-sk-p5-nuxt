import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));

async function fillForm(wrapper: any, nominal = "2500000") {
  await wrapper.find('[data-testid="add-cash-flow-type-input"]').setValue("outflow");
  await wrapper.find('[data-testid="add-cash-flow-source-input"]').setValue("savings");
  await wrapper.find('[data-testid="add-cash-flow-label-input"]').setValue("  belanja  ");
  await wrapper.find('[data-testid="add-cash-flow-nominal-input"]').setValue(nominal);
  await wrapper.find('[data-testid="add-cash-flow-description-input"]').setValue("  Belanja bulanan  ");
}

describe("AddModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({} as any));
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    expect(wrapper.find('[data-testid="add-cash-flow-modal"]').exists()).toBe(false);
  });

  it("should render label suggestions from store", () => {
    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: true },
      preloadedState: { labels: ["gaji", "makan"] },
    });
    expect(wrapper.findAll("datalist option").map((o) => o.attributes("value"))).toEqual([
      "gaji",
      "makan",
    ]);
  });

  it("should validate empty label", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    await wrapper.find("form").trigger("submit");
    expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Label tidak boleh kosong");
  });

  it("should validate invalid nominal", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    await wrapper.find('[data-testid="add-cash-flow-label-input"]').setValue("gaji");
    await wrapper.find("form").trigger("submit");
    expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Nominal harus lebih besar dari 0");
  });

  it("should validate empty description", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    await wrapper.find('[data-testid="add-cash-flow-label-input"]').setValue("gaji");
    await wrapper.find('[data-testid="add-cash-flow-nominal-input"]').setValue("1000");
    await wrapper.find("form").trigger("submit");
    expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Keterangan tidak boleh kosong");
  });

  it("should submit trimmed payload and close with saved event on success", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(AddModal, { props: { show: true } });
    const addSpy = vi
      .spyOn(cashFlowsStore, "asyncSetIsCashFlowAdd")
      .mockReturnValue(Promise.resolve());

    await fillForm(wrapper);
    await wrapper.find("form").trigger("submit");

    expect(addSpy).toHaveBeenCalledWith({
      type: "outflow",
      source: "savings",
      label: "belanja",
      nominal: 2500000,
      description: "Belanja bulanan",
    });
    expect(wrapper.text()).toContain("Menyimpan...");

    cashFlowsStore.setIsCashFlowAdd(true);
    cashFlowsStore.setIsCashFlowAdded(true);
    await tick();

    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(cashFlowsStore.isCashFlowAdd).toBe(false);
    expect(cashFlowsStore.isCashFlowAdded).toBe(false);
    expect(
      (wrapper.find('[data-testid="add-cash-flow-label-input"]').element as HTMLInputElement).value
    ).toBe("");
    expect(
      (wrapper.find('[data-testid="add-cash-flow-type-input"]').element as HTMLSelectElement).value
    ).toBe("inflow");
  });

  it("should stay open when add failed", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(AddModal, { props: { show: true } });
    vi.spyOn(cashFlowsStore, "asyncSetIsCashFlowAdd").mockReturnValue(Promise.resolve());

    await fillForm(wrapper);
    await wrapper.find("form").trigger("submit");

    cashFlowsStore.setIsCashFlowAdd(true);
    cashFlowsStore.setIsCashFlowAdded(false);
    await tick();

    expect(wrapper.emitted("close")).toBeUndefined();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should ignore store flags when no add action finished", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(AddModal, { props: { show: true } });
    cashFlowsStore.setIsCashFlowAdded(true);
    await tick();
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("should emit close from close and cancel buttons", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });

    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    await wrapper.find('[data-testid="cancel-add-modal-btn"]').trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(2);
  });

  it("should lock and unlock body scroll when visibility changes", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });

    await wrapper.setProps({ show: true });
    expect(document.body.style.overflow).toBe("hidden");

    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });
});
