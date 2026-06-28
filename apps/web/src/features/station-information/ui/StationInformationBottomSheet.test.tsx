import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StationInformationBottomSheet } from './StationInformationBottomSheet';

import { mockStationInformation as mockRoute } from '@entities/station/model/fixtures';
import { getStationInformation } from '@entities/station/api/getStationInformation';
import { BusApiError } from '@shared/api';
import { createQueryWrapper } from '@shared/test/queryWrapper';

vi.mock('@entities/station/api/getStationInformation', () => ({
  getStationInformation: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onClose: vi.fn(),
  arsId: '12121',
  stationName: '불광역',
  selectedRouteIds: [] as string[],
  onToggleRoute: vi.fn(),
};

const renderSheet = (props: Partial<typeof defaultProps> = {}) => {
  const mergedProps = { ...defaultProps, ...props };

  return render(<StationInformationBottomSheet {...mergedProps} />, {
    wrapper: createQueryWrapper(),
  });
};

describe('StationInformationBottomSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStationInformation).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('로딩 → 성공 → 15초 후 refetch', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const route = mockRoute();
    vi.mocked(getStationInformation)
      .mockResolvedValueOnce([route])
      .mockResolvedValueOnce([{ ...route, arrmsg1: '1분후[1번째 전]' }]);

    renderSheet();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull();
      expect(screen.getByText('753')).toBeTruthy();
    });
    expect(getStationInformation).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    await waitFor(() => {
      expect(getStationInformation).toHaveBeenCalledTimes(2);
      expect(screen.getByText('1분후[1번째 전]')).toBeTruthy();
    });
  });

  it('목록 표시 후 백그라운드 폴링이 실패해도 목록을 유지하고 갱신 실패를 알린다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    vi.mocked(getStationInformation)
      .mockResolvedValueOnce([mockRoute()])
      .mockRejectedValueOnce(new BusApiError('6', '실시간 정보 읽기 실패'));

    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('753')).toBeTruthy();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    await waitFor(() => {
      expect(getStationInformation).toHaveBeenCalledTimes(2);
    });

    // 폴링 실패 후에도 기존 목록은 그대로 유지되고, 전체 에러 화면으로 교체되지 않는다.
    expect(screen.getByText('753')).toBeTruthy();
    expect(
      screen.queryByText('실시간 도착 정보를 불러오지 못했습니다'),
    ).toBeNull();
    expect(screen.getByText(/최신 정보를 불러오지 못했어요/)).toBeTruthy();
  });

  it('공백이 포함된 "곧 도착" 메시지에 임박 강조(빨간색)를 적용한다', async () => {
    vi.mocked(getStationInformation).mockResolvedValue([
      mockRoute({ arrmsg1: '곧 도착' }),
    ]);

    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('곧 도착').className).toContain('text-red-500');
    });
  });

  it('API 오류 시 빈 목록 문구 대신 에러 UI를 표시한다', async () => {
    vi.mocked(getStationInformation).mockRejectedValue(
      new BusApiError('3', '정류소를 찾을 수 없음'),
    );

    renderSheet({ arsId: '99999' });

    await waitFor(() => {
      expect(
        screen.getByText('정류장 또는 노선 정보를 찾을 수 없습니다'),
      ).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeTruthy();
    expect(screen.queryByText('도착 정보가 없습니다')).toBeNull();
  });

  it('정상 응답이 빈 배열이면 도착 정보 없음을 표시한다', async () => {
    vi.mocked(getStationInformation).mockResolvedValue([]);

    renderSheet({ arsId: 'empty-test' });

    await waitFor(() => {
      expect(screen.getByText('도착 정보가 없습니다')).toBeTruthy();
    });
    expect(screen.queryByRole('button', { name: '다시 시도' })).toBeNull();
  });

  it('에러 상태에서 다시 시도 버튼으로 재조회한다', async () => {
    const route = mockRoute();

    vi.mocked(getStationInformation)
      .mockRejectedValueOnce(new BusApiError('6', '실시간 정보 읽기 실패'))
      .mockResolvedValueOnce([route]);

    renderSheet({ arsId: 'retry-test' });

    await waitFor(() => {
      expect(
        screen.getByText('실시간 도착 정보를 불러오지 못했습니다'),
      ).toBeTruthy();
    });

    await act(async () => {
      screen.getByRole('button', { name: '다시 시도' }).click();
    });

    await waitFor(() => {
      expect(screen.getByText('753')).toBeTruthy();
    });
    expect(getStationInformation).toHaveBeenCalledTimes(2);
  });
});
