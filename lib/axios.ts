import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosHeaders,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { getCookie } from "@/utility/cookies";
import { getPublicApiBaseUrl } from "@/lib/api-base";

const BASE_URL = getPublicApiBaseUrl();

let memoryToken: string | null = null;
export function setAuthToken(token: string | null) {
  memoryToken = token;
}
export function clearAuthToken() {
  memoryToken = null;
}
export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    const fromCookie = getCookie("auth-token");
    return fromCookie || null;
  } catch {
    return null;
  }
}

export type HttpExtra = {
  withAuth?: boolean;
  headers?: Record<string, string>;
};
export type HttpResponse<T> = Promise<T>;

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const healthApi: AxiosInstance = axios.create({
  baseURL: BASE_URL.replace("/v1", ""), // Remove /v1 from base URL
  timeout: 30_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { __extra?: HttpExtra }) => {
    const extra = config.__extra;
    const token = getAuthToken();
    const wantsAuth = extra?.withAuth ?? Boolean(token);
    const addHeaders: Record<string, string> = {};
    if (wantsAuth && token) addHeaders.Authorization = `Bearer ${token}`;
    if (extra?.headers) Object.assign(addHeaders, extra.headers);

    const merged = AxiosHeaders.from({
      ...(config.headers ?? {}),
      ...addHeaders,
    });

    config.headers = merged;
    return config;
  }
);

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError) => {
    const status = err.response?.status;
    const data = err.response?.data as unknown;
    // keep console for visibility; you can route to a logger if needed
    console.error("HTTP Error:", status, data || err.message);
    return Promise.reject(err);
  }
);

function withExtra(config?: AxiosRequestConfig, extra?: HttpExtra) {
  return { ...(config || {}), __extra: extra } as AxiosRequestConfig & {
    __extra?: HttpExtra;
  };
}

const apiService = {
  get: async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
    extra?: HttpExtra
  ): HttpResponse<T> => {
    const res: AxiosResponse<T> = await api.get(url, withExtra(config, extra));
    return res.data;
  },
  post: async <T = unknown, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig,
    extra?: HttpExtra
  ): HttpResponse<T> => {
    const res: AxiosResponse<T> = await api.post(
      url,
      body,
      withExtra(config, extra)
    );
    return res.data;
  },
  put: async <T = unknown, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig,
    extra?: HttpExtra
  ): HttpResponse<T> => {
    const res: AxiosResponse<T> = await api.put(
      url,
      body,
      withExtra(config, extra)
    );
    return res.data;
  },
  patch: async <T = unknown, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig,
    extra?: HttpExtra
  ): HttpResponse<T> => {
    const res: AxiosResponse<T> = await api.patch(
      url,
      body,
      withExtra(config, extra)
    );
    return res.data;
  },
  delete: async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
    extra?: HttpExtra
  ): HttpResponse<T> => {
    const res: AxiosResponse<T> = await api.delete(
      url,
      withExtra(config, extra)
    );
    return res.data;
  },

  raw: api,
  setAuthToken,
  clearAuthToken,
  getAuthToken,
};

export const healthApiService = {
  get: async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
    extra?: HttpExtra
  ): HttpResponse<T> => {
    const res: AxiosResponse<T> = await healthApi.get(
      url,
      withExtra(config, extra)
    );
    return res.data;
  },
};
export default apiService;
