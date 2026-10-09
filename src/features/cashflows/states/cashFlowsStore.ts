import { defineStore } from "pinia";
import cashFlowApi, {
  type CashFlow,
  type CashFlowPayload,
  type CashFlowQueryParams,
  type CashFlowStats,
  type StatsSeries,
  type StatsSeriesParams,
} from "../api/cashFlowApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export type { CashFlow, CashFlowStats, CashFlowQueryParams };

export interface CashFlowsState {
  cashFlows: CashFlow[];
  cashFlow: CashFlow | null;
  stats: CashFlowStats;
  labels: string[];
  statsDaily: StatsSeries | null;
  statsMonthly: StatsSeries | null;
  isCashFlow: boolean;
  isCashFlowAdd: boolean;
  isCashFlowAdded: boolean;
  isCashFlowChange: boolean;
  isCashFlowChanged: boolean;
  isCashFlowDelete: boolean;
  isCashFlowDeleted: boolean;
  isCashFlowDeleteAll: boolean;
  isCashFlowDeletedAll: boolean;
}

export const useCashFlowsStore = defineStore("cashFlows", {
  state: (): CashFlowsState => ({
    cashFlows: [],
    cashFlow: null,
    stats: {},
    labels: [],
    statsDaily: null,
    statsMonthly: null,
    isCashFlow: false,
    isCashFlowAdd: false,
    isCashFlowAdded: false,
    isCashFlowChange: false,
    isCashFlowChanged: false,
    isCashFlowDelete: false,
    isCashFlowDeleted: false,
    isCashFlowDeleteAll: false,
    isCashFlowDeletedAll: false,
  }),
  actions: {
    setCashFlows(cashFlows: CashFlow[]) {
      this.cashFlows = cashFlows;
    },
    setCashFlow(cashFlow: CashFlow | null) {
      this.cashFlow = cashFlow;
    },
    setStats(stats: CashFlowStats) {
      this.stats = stats;
    },
    setLabels(labels: string[]) {
      this.labels = labels;
    },
    setStatsDaily(stats: StatsSeries | null) {
      this.statsDaily = stats;
    },
    setStatsMonthly(stats: StatsSeries | null) {
      this.statsMonthly = stats;
    },
    setIsCashFlow(status: boolean) {
      this.isCashFlow = status;
    },
    setIsCashFlowAdd(status: boolean) {
      this.isCashFlowAdd = status;
    },
    setIsCashFlowAdded(status: boolean) {
      this.isCashFlowAdded = status;
    },
    setIsCashFlowChange(status: boolean) {
      this.isCashFlowChange = status;
    },
    setIsCashFlowChanged(status: boolean) {
      this.isCashFlowChanged = status;
    },
    setIsCashFlowDelete(status: boolean) {
      this.isCashFlowDelete = status;
    },
    setIsCashFlowDeleted(status: boolean) {
      this.isCashFlowDeleted = status;
    },
    setIsCashFlowDeleteAll(status: boolean) {
      this.isCashFlowDeleteAll = status;
    },
    setIsCashFlowDeletedAll(status: boolean) {
      this.isCashFlowDeletedAll = status;
    },
    async asyncSetCashFlows(params: CashFlowQueryParams = {}) {
      try {
        const { cashFlows, stats } = await cashFlowApi.getCashFlows(params);
        this.setCashFlows(cashFlows);
        this.setStats(stats);
      } catch (error) {
        this.setCashFlows([]);
        this.setStats({});
      }
    },
    async asyncSetCashFlow(cashFlowId: string | number) {
      try {
        const cashFlow = await cashFlowApi.getCashFlowById(cashFlowId);
        this.setCashFlow(cashFlow);
      } catch (error) {
        this.setCashFlow(null);
      } finally {
        this.setIsCashFlow(true);
      }
    },
    async asyncSetLabels() {
      try {
        this.setLabels(await cashFlowApi.getLabels());
      } catch (error) {
        this.setLabels([]);
      }
    },
    async asyncSetStatsDaily(params: StatsSeriesParams = {}) {
      try {
        this.setStatsDaily(await cashFlowApi.getStatsDaily(params));
      } catch (error) {
        this.setStatsDaily(null);
      }
    },
    async asyncSetStatsMonthly(params: StatsSeriesParams = {}) {
      try {
        this.setStatsMonthly(await cashFlowApi.getStatsMonthly(params));
      } catch (error) {
        this.setStatsMonthly(null);
      }
    },
    async asyncSetIsCashFlowAdd(payload: CashFlowPayload) {
      try {
        await cashFlowApi.postCashFlow(payload);
        showSuccessDialog("Catatan arus kas berhasil ditambahkan!");
        this.setIsCashFlowAdded(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowAdded(false);
      } finally {
        this.setIsCashFlowAdd(true);
      }
    },
    async asyncSetIsCashFlowChange(cashFlowId: string | number, payload: CashFlowPayload) {
      try {
        const message = await cashFlowApi.putCashFlow(cashFlowId, payload);
        showSuccessDialog(message || "Catatan arus kas berhasil diperbarui!");
        this.setIsCashFlowChanged(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowChanged(false);
      } finally {
        this.setIsCashFlowChange(true);
      }
    },
    async asyncSetIsCashFlowDelete(cashFlowId: string | number) {
      try {
        const message = await cashFlowApi.deleteCashFlow(cashFlowId);
        showSuccessDialog(message || "Catatan arus kas berhasil dihapus!");
        this.setIsCashFlowDeleted(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowDeleted(false);
      } finally {
        this.setIsCashFlowDelete(true);
      }
    },
    async asyncSetIsCashFlowDeleteAll() {
      try {
        const message = await cashFlowApi.deleteAllCashFlows();
        showSuccessDialog(message || "Seluruh catatan arus kas berhasil dihapus!");
        this.setIsCashFlowDeletedAll(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowDeletedAll(false);
      } finally {
        this.setIsCashFlowDeleteAll(true);
      }
    },
  },
});
