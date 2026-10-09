<template>
  <div v-if="profile" class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Ringkasan Arus Kas
        </h1>
        <p class="text-sm text-slate-600 mt-1">
          Pantau pemasukan, pengeluaran, dan saldo kas Anda dalam satu tempat.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          data-testid="reset-cash-flows-btn"
          @click="handleResetAll"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 transition-all"
        >
          <RotateCcw :size="18" aria-hidden="true" />
          <span>Reset Semua</span>
        </button>
        <button
          type="button"
          data-testid="add-cash-flow-btn"
          @click="showAddModal = true"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-teal-700 hover:bg-teal-800 shadow-md shadow-teal-700/25 transition-all"
        >
          <Plus :size="18" :stroke-width="2.5" aria-hidden="true" />
          <span>Tambah Transaksi</span>
        </button>
      </div>
    </div>

    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" class="sr-only">Ringkasan Keuangan</h2>
      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <li
          v-for="card in summaryCards"
          :key="card.key"
          :data-testid="`summary-${card.key}`"
          class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between"
        >
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {{ card.label }}
            </p>
            <p class="text-2xl font-black mt-1" :class="card.color">
              {{ formatRupiah(card.value) }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center" :class="card.badge">
            <component :is="card.icon" :size="24" :stroke-width="2" aria-hidden="true" />
          </div>
        </li>
      </ul>
    </section>

    <section
      aria-labelledby="transactions-heading"
      class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
    >
      <div class="p-4 sm:p-5 border-b border-slate-200 space-y-4">
        <h2 id="transactions-heading" class="text-lg font-bold text-slate-900">Daftar Transaksi</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label for="filter-type" class="block text-xs font-semibold text-slate-700 mb-1">Jenis</label>
            <select
              id="filter-type"
              data-testid="filter-type-select"
              v-model="filterType"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-800"
            >
              <option value="">Semua Jenis</option>
              <option value="inflow">Pemasukan</option>
              <option value="outflow">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label for="filter-source" class="block text-xs font-semibold text-slate-700 mb-1">Sumber Dana</label>
            <select
              id="filter-source"
              data-testid="filter-source-select"
              v-model="filterSource"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-800"
            >
              <option value="">Semua Sumber</option>
              <option value="cash">Tunai</option>
              <option value="savings">Tabungan</option>
              <option value="loans">Pinjaman</option>
            </select>
          </div>
          <div>
            <label for="filter-label" class="block text-xs font-semibold text-slate-700 mb-1">Label</label>
            <select
              id="filter-label"
              data-testid="filter-label-select"
              v-model="filterLabel"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-800"
            >
              <option value="">Semua Label</option>
              <option v-for="item in cashFlowsStore.labels" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <div>
            <label for="filter-start-date" class="block text-xs font-semibold text-slate-700 mb-1">Tanggal Awal</label>
            <input
              id="filter-start-date"
              type="date"
              data-testid="filter-start-date-input"
              v-model="startDate"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-800"
            />
          </div>
          <div>
            <label for="filter-end-date" class="block text-xs font-semibold text-slate-700 mb-1">Tanggal Akhir</label>
            <input
              id="filter-end-date"
              type="date"
              data-testid="filter-end-date-input"
              v-model="endDate"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-800"
            />
          </div>
        </div>
        <button
          type="button"
          data-testid="clear-filter-btn"
          @click="clearFilters"
          class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <FilterX :size="16" aria-hidden="true" />
          Atur Ulang Filter
        </button>
      </div>

      <div v-if="loadingCashFlows && cashFlows.length === 0" class="px-6 py-12 text-center text-slate-600">
        <Loader2 :size="36" class="mx-auto text-teal-700 animate-spin mb-2" aria-hidden="true" />
        <p class="font-medium">Memuat daftar transaksi...</p>
      </div>
      <div v-else-if="cashFlows.length === 0" class="px-6 py-12 text-center text-slate-600">
        <Wallet :size="40" class="mx-auto text-slate-500 mb-2" aria-hidden="true" />
        <p class="font-medium">Belum ada transaksi yang cocok.</p>
      </div>
      <template v-else>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-700">
            <caption class="sr-only">Daftar transaksi arus kas</caption>
            <thead class="bg-slate-50 text-xs uppercase tracking-wider font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th scope="col" class="px-5 py-3.5">Label</th>
                <th scope="col" class="px-5 py-3.5">Jenis</th>
                <th scope="col" class="px-5 py-3.5">Sumber</th>
                <th scope="col" class="px-5 py-3.5 text-right">Nominal</th>
                <th scope="col" class="px-5 py-3.5">Dibuat</th>
                <th scope="col" class="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in cashFlows"
                :key="`row-${item.id}`"
                :data-testid="`cash-flow-row-${item.id}`"
                class="hover:bg-slate-50 transition-colors"
              >
                <td class="px-5 py-4">
                  <p class="font-semibold text-slate-900">{{ item.label }}</p>
                  <p class="text-xs text-slate-600 line-clamp-1">{{ item.description }}</p>
                </td>
                <td class="px-5 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                    :class="badgeClass(item.type)"
                  >
                    {{ typeLabel(item.type) }}
                  </span>
                </td>
                <td class="px-5 py-4">{{ formatSource(item.source) }}</td>
                <td class="px-5 py-4 text-right font-semibold" :class="item.type === 'inflow' ? 'text-emerald-800' : 'text-red-800'">
                  {{ formatRupiah(item.nominal) }}
                </td>
                <td class="px-5 py-4 text-xs text-slate-600">{{ formatDate(item.created_at) }}</td>
                <td class="px-5 py-4 text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      :data-testid="`view-cash-flow-${item.id}`"
                      :aria-label="`Lihat detail ${item.label}`"
                      @click="router.push(`/cash-flows/${item.id}`)"
                      class="p-1.5 text-slate-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors"
                    >
                      <Eye :size="18" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      :data-testid="`edit-cash-flow-${item.id}`"
                      :aria-label="`Ubah ${item.label}`"
                      @click="handleEdit(item.id)"
                      class="p-1.5 text-slate-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Pencil :size="18" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      :data-testid="`delete-cash-flow-${item.id}`"
                      :aria-label="`Hapus ${item.label}`"
                      @click="handleDelete(item.id)"
                      class="p-1.5 text-slate-700 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 :size="18" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul class="md:hidden divide-y divide-slate-100">
          <li
            v-for="item in cashFlows"
            :key="`card-${item.id}`"
            :data-testid="`cash-flow-card-${item.id}`"
            class="p-4 space-y-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-semibold text-slate-900 truncate">{{ item.label }}</p>
                <p class="text-xs text-slate-600">{{ formatSource(item.source) }} · {{ formatDate(item.created_at) }}</p>
              </div>
              <span
                class="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                :class="badgeClass(item.type)"
              >
                {{ typeLabel(item.type) }}
              </span>
            </div>
            <p class="text-lg font-bold" :class="item.type === 'inflow' ? 'text-emerald-800' : 'text-red-800'">
              {{ formatRupiah(item.nominal) }}
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                :data-testid="`card-view-cash-flow-${item.id}`"
                @click="router.push(`/cash-flows/${item.id}`)"
                class="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 rounded-lg"
              >
                Detail
              </button>
              <button
                type="button"
                :data-testid="`card-edit-cash-flow-${item.id}`"
                @click="handleEdit(item.id)"
                class="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 rounded-lg"
              >
                Ubah
              </button>
              <button
                type="button"
                :data-testid="`card-delete-cash-flow-${item.id}`"
                @click="handleDelete(item.id)"
                class="px-3 py-1.5 text-xs font-semibold text-red-800 bg-red-50 rounded-lg"
              >
                Hapus
              </button>
            </div>
          </li>
        </ul>
      </template>
    </section>

    <AddModal :show="showAddModal" @close="showAddModal = false" @saved="loadAll" />
    <ChangeModal
      :show="showChangeModal"
      :cash-flow-id="selectedCashFlowId"
      @close="showChangeModal = false"
      @saved="loadAll"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import AddModal from "../modals/AddModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { useUsersStore } from "../../users/states/usersStore";
import {
  formatDate,
  formatRupiah,
  formatSource,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Banknote,
  PiggyBank,
  HandCoins,
  Eye,
  Pencil,
  Trash2,
  FilterX,
  RotateCcw,
  Loader2,
} from "lucide-vue-next";

const router = useRouter();
const cashFlowsStore = useCashFlowsStore();
const usersStore = useUsersStore();

const profile = computed(() => usersStore.profile);
const cashFlows = computed(() => cashFlowsStore.cashFlows);

const loadingCashFlows = ref(false);
const filterType = ref("");
const filterSource = ref("");
const filterLabel = ref("");
const startDate = ref("");
const endDate = ref("");
const showAddModal = ref(false);
const showChangeModal = ref(false);
const selectedCashFlowId = ref<number | string | null>(null);

function stat(key: string): number {
  return Number(cashFlowsStore.stats[key] ?? 0);
}

const summaryCards = computed(() => [
  {
    key: "balance",
    label: "Total Saldo Kas Bersih",
    value: stat("cashflow"),
    icon: Wallet,
    color: "text-slate-900",
    badge: "bg-slate-100 text-slate-800",
  },
  {
    key: "inflow",
    label: "Total Pemasukan",
    value: stat("total_inflow"),
    icon: TrendingUp,
    color: "text-emerald-800",
    badge: "bg-emerald-50 text-emerald-800",
  },
  {
    key: "outflow",
    label: "Total Pengeluaran",
    value: stat("total_outflow"),
    icon: TrendingDown,
    color: "text-red-800",
    badge: "bg-red-50 text-red-800",
  },
  {
    key: "cash",
    label: "Saldo Kas Tunai",
    value: stat("total_inflow_cash") - stat("total_outflow_cash"),
    icon: Banknote,
    color: "text-teal-800",
    badge: "bg-teal-50 text-teal-800",
  },
  {
    key: "savings",
    label: "Saldo Rekening Tabungan",
    value: stat("total_inflow_savings") - stat("total_outflow_savings"),
    icon: PiggyBank,
    color: "text-sky-800",
    badge: "bg-sky-50 text-sky-800",
  },
  {
    key: "loans",
    label: "Saldo Pinjaman",
    value: stat("total_inflow_loans") - stat("total_outflow_loans"),
    icon: HandCoins,
    color: "text-amber-800",
    badge: "bg-amber-50 text-amber-800",
  },
]);

function typeLabel(type: string): string {
  return type === "inflow" ? "Pemasukan" : "Pengeluaran";
}

function badgeClass(type: string): string {
  return type === "inflow"
    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : "bg-red-50 text-red-800 border-red-200";
}

function loadCashFlows() {
  loadingCashFlows.value = true;
  return Promise.resolve(
    cashFlowsStore.asyncSetCashFlows({
      type: filterType.value,
      source: filterSource.value,
      label: filterLabel.value,
      start_date: startDate.value ? `${startDate.value} 00:00:00` : "",
      end_date: endDate.value ? `${endDate.value} 23:59:59` : "",
    })
  ).finally(() => {
    loadingCashFlows.value = false;
  });
}

function loadAll() {
  cashFlowsStore.asyncSetLabels();
  return loadCashFlows();
}

onMounted(() => {
  loadAll();
});

watch([filterType, filterSource, filterLabel, startDate, endDate], () => {
  loadCashFlows();
});

watch(
  () => cashFlowsStore.isCashFlowDeleted,
  (deleted) => {
    if (deleted) {
      cashFlowsStore.setIsCashFlowDeleted(false);
      loadAll();
    }
  }
);

watch(
  () => cashFlowsStore.isCashFlowDeletedAll,
  (deleted) => {
    if (deleted) {
      cashFlowsStore.setIsCashFlowDeletedAll(false);
      loadAll();
    }
  }
);

function clearFilters() {
  filterType.value = "";
  filterSource.value = "";
  filterLabel.value = "";
  startDate.value = "";
  endDate.value = "";
}

function handleEdit(cashFlowId: number | string) {
  selectedCashFlowId.value = cashFlowId;
  showChangeModal.value = true;
}

async function handleDelete(cashFlowId: number | string) {
  const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus transaksi ini?");
  if (result.isConfirmed) {
    cashFlowsStore.asyncSetIsCashFlowDelete(cashFlowId);
  }
}

async function handleResetAll() {
  const result = await showConfirmDialog(
    "Apakah Anda yakin ingin menghapus SELURUH transaksi arus kas? Tindakan ini tidak dapat dibatalkan."
  );
  if (result.isConfirmed) {
    cashFlowsStore.asyncSetIsCashFlowDeleteAll();
  }
}
</script>
