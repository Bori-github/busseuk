import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchOverlay } from './SearchOverlay';

import type { StationSearchResult } from '@entities/station';
import { getStationsByName } from '@entities/station/api/getStationsByName';
import { createQueryWrapper } from '@shared/test/queryWrapper';

vi.mock('@entities/station/api/getStationsByName', () => ({
  getStationsByName: vi.fn(),
}));

const RESULTS: StationSearchResult[] = [
  { stId: '1', stNm: '강남역', arsId: '22001', tmX: '127.0276', tmY: '37.4979' },
  { stId: '2', stNm: '강남구청', arsId: '22002', tmX: '127.0473', tmY: '37.5172' },
];

const renderOverlay = () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();

  render(<SearchOverlay onSelect={onSelect} onClose={onClose} />, {
    wrapper: createQueryWrapper(),
  });

  return { onSelect, onClose };
};

// 검색어 입력 → 디바운스(300ms) 경과 → 결과가 활성화될 때까지 대기
const searchAndSettle = async (keyword: string, label: RegExp) => {
  fireEvent.change(screen.getByPlaceholderText('정류소 검색'), {
    target: { value: keyword },
  });

  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  await waitFor(() => {
    expect(screen.getByRole('button', { name: label })).toHaveProperty(
      'disabled',
      false,
    );
  });
};

describe('SearchOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('검색 결과를 클릭하면 해당 정류장으로 onSelect를 호출한다', async () => {
    vi.mocked(getStationsByName).mockResolvedValue(RESULTS);
    const { onSelect } = renderOverlay();

    await searchAndSettle('강남', /강남역/);

    await act(async () => {
      screen.getByRole('button', { name: /강남역/ }).click();
    });

    expect(onSelect).toHaveBeenCalledWith(RESULTS[0]);
  });

  it('엔터를 누르면 첫 번째 검색 결과로 onSelect를 호출한다', async () => {
    vi.mocked(getStationsByName).mockResolvedValue(RESULTS);
    const { onSelect } = renderOverlay();

    await searchAndSettle('강남', /강남역/);

    fireEvent.keyDown(screen.getByPlaceholderText('정류소 검색'), {
      key: 'Enter',
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(RESULTS[0]);
  });

  it('검색이 정착되기 전(디바운스 중)에는 엔터를 무시한다', async () => {
    vi.mocked(getStationsByName).mockResolvedValue(RESULTS);
    const { onSelect } = renderOverlay();

    const input = screen.getByPlaceholderText('정류소 검색');
    fireEvent.change(input, { target: { value: '강남' } });

    // 디바운스 경과 전이라 결과 목록이 아직 없고 canSelect=false
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByText('강남역')).toBeNull();
  });
});
