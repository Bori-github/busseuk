import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BusApiError, busGet } from './busClient';

// busClient가 모듈 로드 시 등록하는 인터셉터를 가로채 실제 로직을 검증한다.
const { get, store } = vi.hoisted(() => ({
  get: vi.fn(),
  store: {
    request: undefined as ((config: unknown) => unknown) | undefined,
    responseFulfilled: undefined as ((response: unknown) => unknown) | undefined,
    responseRejected: undefined as ((error: unknown) => unknown) | undefined,
  },
}));

vi.mock('axios', () => {
  const instance = {
    interceptors: {
      request: {
        use: (fn: (config: unknown) => unknown) => (store.request = fn),
      },
      response: {
        use: (onFulfilled: (response: unknown) => unknown, onRejected: (error: unknown) => unknown) => {
          store.responseFulfilled = onFulfilled;
          store.responseRejected = onRejected;
        },
      },
    },
    get,
  };

  const isAxiosError = (error: unknown) => Boolean((error as { isAxiosError?: boolean })?.isAxiosError);

  return {
    default: { create: vi.fn(() => instance), isAxiosError },
    isAxiosError,
  };
});

vi.mock('@shared/config', () => ({
  ENV: { BUS_API_BASE_URL: '/api/bus', BUS_API_SERVICE_KEY: 'test-key' },
}));

const ROUTE = {
  busRouteId: '100100118',
  busRouteAbrv: '753',
  rtNm: '753',
  routeType: '3',
  adirection: '신설동',
  arrmsg1: '3분후',
  arrmsg2: '-',
};

const httpResponse = (itemList: unknown) => ({
  data: { msgBody: { itemList } },
});

describe('busGet (itemList 정규화)', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('지정한 path와 params로 요청한다', async () => {
    get.mockResolvedValue(httpResponse([]));

    await busGet('/stationinfo/getStationByUid', { arsId: '12121' });

    expect(get).toHaveBeenCalledWith('/stationinfo/getStationByUid', {
      params: { arsId: '12121' },
    });
  });

  it('itemList가 배열이면 그대로 반환한다', async () => {
    const list = [ROUTE, { ...ROUTE, busRouteId: '200' }];
    get.mockResolvedValue(httpResponse(list));

    await expect(busGet('/path')).resolves.toEqual(list);
  });

  it('itemList가 단일 객체면 배열로 감싸 반환한다 (노선 1개 응답 대응)', async () => {
    get.mockResolvedValue(httpResponse(ROUTE));

    await expect(busGet('/path')).resolves.toEqual([ROUTE]);
  });

  it('itemList가 null이면 빈 배열을 반환한다', async () => {
    get.mockResolvedValue(httpResponse(null));

    await expect(busGet('/path')).resolves.toEqual([]);
  });

  it('itemList 키가 없으면 빈 배열을 반환한다', async () => {
    get.mockResolvedValue({ data: { msgBody: {} } });

    await expect(busGet('/path')).resolves.toEqual([]);
  });
});

describe('request 인터셉터', () => {
  it('resultType과 serviceKey를 주입하고 기존 params를 보존한다', () => {
    const config = store.request?.({ params: { arsId: '12121' } }) as {
      params: Record<string, unknown>;
    };

    expect(config.params).toEqual({
      arsId: '12121',
      resultType: 'json',
      serviceKey: 'test-key',
    });
  });
});

describe('response 인터셉터', () => {
  it('headerCd가 "0"이면 응답을 그대로 통과시킨다', () => {
    const response = {
      data: { msgHeader: { headerCd: '0', headerMsg: '정상' } },
    };

    expect(store.responseFulfilled?.(response)).toBe(response);
  });

  it('headerCd가 "0"이 아니면 BusApiError를 던진다', () => {
    const response = {
      data: {
        msgHeader: { headerCd: '3', headerMsg: '정류소를 찾을 수 없음' },
      },
    };

    expect(() => store.responseFulfilled?.(response)).toThrowError(BusApiError);
    try {
      store.responseFulfilled?.(response);
    } catch (error) {
      expect(error).toBeInstanceOf(BusApiError);
      expect((error as BusApiError).headerCd).toBe('3');
      expect((error as BusApiError).message).toBe('정류소를 찾을 수 없음');
    }
  });

  it('HTTP 응답이 있는 axios 오류는 상태코드 메시지로 변환한다', () => {
    const axiosError = { isAxiosError: true, response: { status: 500 } };

    expect(() => store.responseRejected?.(axiosError)).toThrowError('버스 API HTTP 오류: 500');
  });

  it('응답이 없는 axios 오류는 네트워크 오류 메시지로 변환한다', () => {
    const axiosError = { isAxiosError: true, message: 'Network Error' };

    expect(() => store.responseRejected?.(axiosError)).toThrowError('버스 API 네트워크 오류: Network Error');
  });

  it('axios 오류가 아니면 원본 오류를 그대로 전파한다', () => {
    const raw = new Error('unexpected');

    expect(() => store.responseRejected?.(raw)).toThrowError(raw);
  });
});

describe('BusApiError', () => {
  it.each([
    ['3', true],
    ['4', true],
    ['7', true],
    ['0', false],
    ['6', false],
  ])('headerCd %s → isNotFound %s', (headerCd, expected) => {
    expect(new BusApiError(headerCd, '').isNotFound).toBe(expected);
  });

  it.each([
    ['6', true],
    ['3', false],
    ['0', false],
  ])('headerCd %s → isRetryable %s', (headerCd, expected) => {
    expect(new BusApiError(headerCd, '').isRetryable).toBe(expected);
  });
});
