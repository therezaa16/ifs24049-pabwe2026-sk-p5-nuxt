<template>
  <div
    v-if="show"
    data-testid="change-cash-flow-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="change-cash-flow-title"
    class="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto"
  >
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
          <Edit3 :size="18" :stroke-width="2.5" aria-hidden="true" />
        </div>
        <div>
          <h2 id="change-cash-flow-title" class="text-base font-bold text-slate-800">Ubah Transaksi</h2>
          <p class="text-xs text-slate-600">Perbarui data transaksi arus kas yang tersimpan</p>
        </div>
      </div>
      <button
        type="button"
        data-testid="close-change-modal-btn"
        aria-label="Tutup"
        @click="onClose"
        class="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
      >
        <X :size="20" aria-hidden="true" />
      </button>
    </div>

    <form @submit.prevent="handleSave" class="flex-1 flex flex-col bg-white">
      <div class="flex-1 p-6 md:p-8 space-y-5 w-full max-w-3xl mx-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label for="change-cash-flow-type" class="block text-sm font-semibold text-slate-700 mb-1.5">Jenis Arus Kas</label>
            <select
              id="change-cash-flow-type"
              data-testid="change-cash-flow-type-input"
              v-model="type"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
            >
              <option value="inflow">Pemasukan (Inflow)</option>
              <option value="outflow">Pengeluaran (Outflow)</option>
            </select>
          </div>
          <div>
            <label for="change-cash-flow-source" class="block text-sm font-semibold text-slate-700 mb-1.5">Sumber Dana</label>
            <select
              id="change-cash-flow-source"
              data-testid="change-cash-flow-source-input"
              v-model="source"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
            >
              <option value="cash">Tunai</option>
              <option value="savings">Tabungan</option>
              <option value="loans">Pinjaman</option>
            </select>
          </div>
        </div>

        <div>
          <label for="change-cash-flow-label" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Label Kategori <span class="text-red-700" aria-hidden="true">*</span>
          </label>
          <input
            id="change-cash-flow-label"
            type="text"
            list="change-cash-flow-labels"
            data-testid="change-cash-flow-label-input"
            v-model="label"
            placeholder="Contoh: gaji"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
          />
          <datalist id="change-cash-flow-labels">
            <option v-for="item in cashFlowsStore.labels" :key="item" :value="item" />
          </datalist>
        </div>

        <div>
          <label for="change-cash-flow-nominal" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Nominal (Rupiah) <span class="text-red-700" aria-hidden="true">*</span>
          </label>
          <input
            id="change-cash-flow-nominal"
            type="number"
            min="1"
            data-testid="change-cash-flow-nominal-input"
            v-model="nominal"
            placeholder="Contoh: 2500000"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
          />
        </div>

        <div>
          <label for="change-cash-flow-description" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Keterangan <span class="text-red-700" aria-hidden="true">*</span>
          </label>
          <textarea
            id="change-cash-flow-description"
            rows="4"
            data-testid="change-cash-flow-description-input"
            v-model="description"
            placeholder="Tuliskan keterangan transaksi..."
            class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
        <button
          type="button"
          data-testid="cancel-change-modal-btn"
          @click="onClose"
          :disabled="loading"
          class="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          data-testid="submit-change-modal-btn"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-md shadow-teal-700/25 transition-all disabled:opacity-60"
        >
          <template v-if="loading">
            <Loader2 :size="18" class="animate-spin" aria-hidden="true" />
            <span>Menyimpan...</span>
          </template>
          <template v-else>
            <Edit3 :size="18" :stroke-width="2.5" aria-hidden="true" />
            <span>Perbarui Transaksi</span>
          </template>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Edit3, X, Loader2 } from "lucide-vue-next";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { showErrorDialog } from "../../../helpers/toolsHelper";

interface ChangeModalProps {
  show?: boolean;
  cashFlowId?: number | string | null;
}

const props = withDefaults(defineProps<ChangeModalProps>(), {
  show: false,
  cashFlowId: null,
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const cashFlowsStore = useCashFlowsStore();

const loading = ref(false);
const type = ref("inflow");
const source = ref("cash");
const label = ref("");
const nominal = ref<string | number>("");
const description = ref("");

function onClose() {
  emit("close");
}

function syncCashFlow() {
  const current = cashFlowsStore.cashFlow;
  if (current && props.show) {
    type.value = current.type;
    source.value = current.source;
    label.value = current.label;
    nominal.value = current.nominal;
    description.value = current.description;
  }
}

watch(
  () => [props.cashFlowId, props.show],
  ([newId, newShow]) => {
    if (newId && newShow) {
      cashFlowsStore.asyncSetCashFlow(newId as number | string);
    }
  },
  { immediate: true }
);

watch(() => [cashFlowsStore.cashFlow, props.show], syncCashFlow, {
  immediate: true,
  deep: true,
});

watch(
  () => props.show,
  (newShow) => {
    document.body.style.overflow = newShow ? "hidden" : "auto";
  }
);

watch(
  () => [cashFlowsStore.isCashFlowChange, cashFlowsStore.isCashFlowChanged],
  ([isCashFlowChange, isCashFlowChanged]) => {
    if (isCashFlowChange) {
      loading.value = false;
      cashFlowsStore.setIsCashFlowChange(false);
      if (isCashFlowChanged) {
        cashFlowsStore.setIsCashFlowChanged(false);
        emit("saved");
        onClose();
      }
    }
  }
);

function handleSave() {
  if (!label.value.trim()) {
    showErrorDialog("Label tidak boleh kosong");
    return;
  }

  if (!(Number(nominal.value) > 0)) {
    showErrorDialog("Nominal harus lebih besar dari 0");
    return;
  }

  if (!description.value.trim()) {
    showErrorDialog("Keterangan tidak boleh kosong");
    return;
  }

  loading.value = true;
  cashFlowsStore.asyncSetIsCashFlowChange(props.cashFlowId as number | string, {
    type: type.value,
    source: source.value,
    label: label.value.trim(),
    nominal: Number(nominal.value),
    description: description.value.trim(),
  });
}
</script>
