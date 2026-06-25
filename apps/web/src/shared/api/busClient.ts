import axios from 'axios';
import { ENV } from '@shared/config';

interface BusApiHeader {
  headerCd: string;
  headerMsg: string;
  itemCount: number;
}

interface BusApiResponse<T> {
  msgHeader: BusApiHeader;
  msgBody: {
    itemList?: T | T[] | null;
  };
}

export class BusApiError extends Error {
  readonly headerCd: string;

  constructor(headerCd: string, message: string) {
    super(message);
    this.name = 'BusApiError';
    this.headerCd = headerCd;
  }

  get isNotFound() {
    return ['3', '4', '7'].includes(this.headerCd);
  }

  get isRetryable() {
    return this.headerCd === '6';
  }
}

const normalizeItemList = <T>(items: T | T[] | null | undefined): T[] => {
  if (items == null) return [];
  return Array.isArray(items) ? items : [items];
};

const busHttp = axios.create({
  baseURL: ENV.BUS_API_BASE_URL,
});

busHttp.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    resultType: 'json',
    serviceKey: ENV.BUS_API_SERVICE_KEY,
  };

  return config;
});

busHttp.interceptors.response.use(
  (response) => {
    const { headerCd, headerMsg } = response.data.msgHeader;

    if (headerCd !== '0') {
      throw new BusApiError(headerCd, headerMsg);
    }

    return response;
  },
  (err) => {
    if (!axios.isAxiosError(err)) throw err;

    const status = err.response?.status;

    throw new Error(
      status != null
        ? `버스 API HTTP 오류: ${status}`
        : `버스 API 네트워크 오류: ${err.message}`,
      { cause: err },
    );
  },
);

export const busGet = async <T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T[]> => {
  const { data } = await busHttp.get<BusApiResponse<T>>(path, { params });

  return normalizeItemList(data.msgBody.itemList);
};
