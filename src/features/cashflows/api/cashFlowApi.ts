import apiHelper from "../../../helpers/apiHelper";

export type CashFlowType = "inflow" | "outflow";
export type CashFlowSource = "cash" | "savings" | "loans";

export interface CashFlow {
  id: number;
  user_id?: number;
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  description: string;
  nominal: number;
  created_at?: string;
  updated_at?: string;
}

export interface CashFlowPayload {
  type: CashFlowType | string;
  source: CashFlowSource | string;
  label: string;
  nominal: number;
  description: string;
}

export interface CashFlowStats {
  cashflow?: number;
  total_inflow?: number;
  total_outflow?: number;
  [key: string]: number | undefined;
}

export interface CashFlowQueryParams {
  type?: string;
  source?: string;
  label?: string;
  start_date?: string;
  end_date?: string;
}

export interface CashFlowListResult {
  cashFlows: CashFlow[];
  stats: CashFlowStats;
}

export interface StatsSeriesParams {
  end_date?: string;
  total_data?: number | string;
}

export interface StatsSeries {
  stats_inflow: Record<string, number>;
  stats_outflow: Record<string, number>;
  stats_cashflow: Record<string, number>;
}

export interface PostCashFlowResult {
  cash_flow_id?: number;
  [key: string]: any;
}

const cashFlowApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/cash-flows`;

  function _url(path: string): string {
    return BASE_URL + path;
  }

  function buildQuery(params: Record<string, string | number | null | undefined> = {}): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, String(value));
      }
    });
    const text = query.toString();
    return text ? `?${text}` : "";
  }

  async function request(url: string, options: RequestInit, fallbackMessage: string): Promise<any> {
    const response = await apiHelper.fetchData(url, options);
    const result = await response.json();
    if (result.status !== "success") {
      throw new Error(result.message || fallbackMessage);
    }
    return result;
  }

  function jsonOptions(method: string, payload: CashFlowPayload): RequestInit {
    return {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: payload.type,
        source: payload.source,
        label: payload.label,
        nominal: payload.nominal,
        description: payload.description,
      }),
    };
  }

  async function postCashFlow(payload: CashFlowPayload): Promise<PostCashFlowResult> {
    const result = await request(
      _url("/"),
      jsonOptions("POST", payload),
      "Gagal menambahkan catatan arus kas"
    );
    return result.data;
  }

  async function putCashFlow(cashFlowId: string | number, payload: CashFlowPayload): Promise<string> {
    const result = await request(
      _url(`/${cashFlowId}`),
      jsonOptions("PUT", payload),
      "Gagal mengubah catatan arus kas"
    );
    return result.message;
  }

  async function getCashFlows(params: CashFlowQueryParams = {}): Promise<CashFlowListResult> {
    const result = await request(
      _url(`/${buildQuery({ ...params })}`),
      { method: "GET" },
      "Gagal mengambil data arus kas"
    );
    return {
      cashFlows: result.data?.cash_flows || [],
      stats: result.data?.stats || {},
    };
  }

  async function getCashFlowById(cashFlowId: string | number): Promise<CashFlow> {
    const result = await request(
      _url(`/${cashFlowId}`),
      { method: "GET" },
      "Gagal mengambil detail arus kas"
    );
    return result.data?.cash_flow;
  }

  async function deleteCashFlow(cashFlowId: string | number): Promise<string> {
    const result = await request(
      _url(`/${cashFlowId}`),
      { method: "DELETE" },
      "Gagal menghapus catatan arus kas"
    );
    return result.message;
  }

  async function getLabels(): Promise<string[]> {
    const result = await request(_url("/labels"), { method: "GET" }, "Gagal mengambil label arus kas");
    return result.data?.labels || [];
  }

  async function getStatsDaily(params: StatsSeriesParams = {}): Promise<StatsSeries> {
    const result = await request(
      _url(`/stats/daily${buildQuery({ ...params })}`),
      { method: "GET" },
      "Gagal mengambil statistik harian"
    );
    return result.data;
  }

  async function getStatsMonthly(params: StatsSeriesParams = {}): Promise<StatsSeries> {
    const result = await request(
      _url(`/stats/monthly${buildQuery({ ...params })}`),
      { method: "GET" },
      "Gagal mengambil statistik bulanan"
    );
    return result.data;
  }

  async function deleteAllCashFlows(): Promise<string> {
    const result = await request(
      _url("/"),
      { method: "DELETE" },
      "Gagal mereset catatan arus kas"
    );
    return result.message;
  }

  return {
    postCashFlow,
    putCashFlow,
    getCashFlows,
    getCashFlowById,
    deleteCashFlow,
    getLabels,
    getStatsDaily,
    getStatsMonthly,
    deleteAllCashFlows,
  };
})();

export default cashFlowApi;
