<template>
  <div v-if="!profile || !cashFlow" class="flex flex-col items-center justify-center py-20" role="status">
    <div class="w-8 h-8 border-4 border-teal-700 border-t-transparent rounded-full animate-spin" />
    <span class="sr-only">Memuat detail transaksi...</span>
  </div>

  <div v-else class="space-y-6 max-w-3xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <RouterLink
        to="/"
        data-testid="back-to-cash-flows-link"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-teal-800 transition-colors"
      >
        <ArrowLeft :size="18" aria-hidden="true" />
        Kembali ke Ringkasan
      </RouterLink>

      <div class="flex items-center gap-2">
        <button
          type="button"
          data-testid="edit-detail-cash-flow-btn"
          @click="showEditModal = true"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
        >
          <Edit3 :size="16" aria-hidden="true" />
          Ubah Data
        </button>
        <button
          type="button"
          data-testid="delete-detail-cash-flow-btn"
          @click="handleDelete"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
        >
          <Trash2 :size="16" aria-hidden="true" />
          Hapus
        </button>
      </div>
    </div>

    <article class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-6 sm:p-8 space-y-6">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-slate-600">#{{ cashFlow.id }}</span>
            <span
              data-testid="detail-type-badge"
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
              :class="
                cashFlow.type === 'inflow'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              "
            >
              {{ cashFlow.type === "inflow" ? "Pemasukan" : "Pengeluaran" }}
            </span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ cashFlow.label }}
          </h1>
          <p
            data-testid="detail-nominal"
            class="text-3xl font-black"
            :class="cashFlow.type === 'inflow' ? 'text-emerald-800' : 'text-red-800'"
          >
            {{ formatRupiah(cashFlow.nominal) }}
          </p>
        </div>

        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Sumber Dana</dt>
            <dd class="mt-1 font-semibold text-slate-900">{{ formatSource(cashFlow.source) }}</dd>
          </div>
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Label</dt>
            <dd class="mt-1 font-semibold text-slate-900">{{ cashFlow.label }}</dd>
          </div>
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Dibuat</dt>
            <dd class="mt-1 text-slate-900">{{ formatDate(cashFlow.created_at) }}</dd>
          </div>
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Diperbarui</dt>
            <dd class="mt-1 text-slate-900">{{ formatDate(cashFlow.updated_at) }}</dd>
          </div>
        </dl>

        <section aria-labelledby="note-heading">
          <h2 id="note-heading" class="text-sm font-bold text-slate-800 mb-2">Keterangan</h2>
          <p
            data-testid="cash-flow-detail-description"
            class="text-slate-700 bg-slate-50 p-5 rounded-2xl border border-slate-200 leading-relaxed whitespace-pre-line"
          >
            {{ cashFlow.description || "Tidak ada keterangan untuk transaksi ini." }}
          </p>
        </section>
      </div>
    </article>

    <ChangeModal
      :show="showEditModal"
      :cash-flow-id="cashFlow.id"
      @close="showEditModal = false"
      @saved="reloadCashFlow"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import ChangeModal from "../modals/ChangeModal.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { useUsersStore } from "../../users/states/usersStore";
import {
  formatDate,
  formatRupiah,
  formatSource,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";
import { ArrowLeft, Edit3, Trash2 } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const cashFlowsStore = useCashFlowsStore();
const usersStore = useUsersStore();

const cashFlowId = computed(() => route.params.cashFlowId as string);
const profile = computed(() => usersStore.profile);
const cashFlow = computed(() => cashFlowsStore.cashFlow);

const showEditModal = ref(false);

function reloadCashFlow() {
  cashFlowsStore.asyncSetCashFlow(cashFlowId.value);
}

onMounted(() => {
  reloadCashFlow();
});

watch(cashFlowId, (newId) => {
  if (newId) {
    cashFlowsStore.asyncSetCashFlow(newId);
  }
});

watch(
  () => [cashFlowsStore.isCashFlow, cashFlowsStore.cashFlow],
  ([isCashFlow, current]) => {
    if (isCashFlow) {
      cashFlowsStore.setIsCashFlow(false);
      if (!current) {
        router.push("/");
      }
    }
  }
);

watch(
  () => cashFlowsStore.isCashFlowDeleted,
  (isDeleted) => {
    if (isDeleted) {
      cashFlowsStore.setIsCashFlowDeleted(false);
      router.push("/");
    }
  }
);

async function handleDelete() {
  const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus transaksi ini?");
  if (result.isConfirmed) {
    cashFlowsStore.asyncSetIsCashFlowDelete(cashFlowId.value);
  }
}
</script>
