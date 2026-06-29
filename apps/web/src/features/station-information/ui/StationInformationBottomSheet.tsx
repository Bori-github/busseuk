import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getRouteTypeColor, getRouteTypeLabel } from '@entities/bus';
import { getStationInformationQueryOptions } from '@entities/station';
import { BusApiError } from '@shared/api';
import { cn } from '@shared/lib';
import { BottomSheet } from '@shared/ui';

const MAX_SELECTED_ROUTES = 5;

const isImminent = (msg: string) => msg.replace(/\s/g, '').startsWith('곧도착');
const hasArrival = (msg: string) => msg && msg !== '-';

const getStationInformationErrorMessage = (error: unknown) => {
  if (error instanceof BusApiError) {
    if (error.isNotFound) {
      return '정류장 또는 노선 정보를 찾을 수 없습니다';
    }
    if (error.isRetryable) {
      return '실시간 도착 정보를 불러오지 못했습니다';
    }
    return error.message;
  }

  return '도착 정보를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요';
};

/** 지도 버스 마커 렌더링에 필요한, 선택된 노선의 메타 정보 */
export interface SelectedRoute {
  busRouteId: string;
  busRouteAbrv: string;
  routeType: string;
  adirection: string;
}

interface StationInformationBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  arsId: string;
  stationName: string;
  selectedRouteIds: string[];
  onToggleRoute: (route: SelectedRoute) => void;
}

export const StationInformationBottomSheet = ({
  open,
  onOpenChange,
  onClose,
  arsId,
  stationName,
  selectedRouteIds,
  onToggleRoute,
}: StationInformationBottomSheetProps) => {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    ...getStationInformationQueryOptions(arsId),
    enabled: open && Boolean(arsId),
    refetchInterval: (query) => {
      // 초기 로드 실패(데이터 없음)면 자동 폴링을 멈추고 수동 재시도에 맡긴다.
      // 데이터가 있는 상태의 백그라운드 실패는 일시적일 수 있으므로 폴링을 유지해 자동 회복시킨다.
      const hasData = (query.state.data?.length ?? 0) > 0;
      if (query.state.status === 'error' && !hasData) return false;
      return 15_000;
    },
  });

  const handleToggle = (route: SelectedRoute, checked: boolean) => {
    if (checked && selectedRouteIds.length >= MAX_SELECTED_ROUTES) {
      toast.error(`최대 ${MAX_SELECTED_ROUTES}개 노선까지 선택할 수 있습니다`);
      return;
    }
    onToggleRoute(route);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      onClose={onClose}
      className="bg-neutral-900 text-white"
      handleClassName="bg-gray-600"
    >
      <BottomSheet.Header>
        <BottomSheet.Title>{stationName}</BottomSheet.Title>
        <BottomSheet.Close className="text-gray-400 hover:bg-white/10" />
      </BottomSheet.Header>
      <BottomSheet.Content>
        {/* TODO: Spinner 추가 */}
        {isLoading && (
          <div className="space-y-1 p-3 text-sm text-gray-400">Loading...</div>
        )}
        {!isLoading && isError && data.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <p className="text-sm text-gray-400">
              {getStationInformationErrorMessage(error)}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className={cn(
                'rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {isFetching ? '다시 불러오는 중...' : '다시 시도'}
            </button>
          </div>
        )}
        {!isLoading && !isError && data.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            도착 정보가 없습니다
          </p>
        )}
        {!isLoading && data.length > 0 && (
          <>
            {isError && (
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className={cn(
                  'flex w-full items-center justify-center bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-300',
                  'disabled:opacity-60',
                )}
              >
                {isFetching
                  ? '최신 정보를 불러오는 중...'
                  : '최신 정보를 불러오지 못했어요 · 다시 시도'}
              </button>
            )}
            <ul className="divide-y divide-white/10">
              {data.map((item) => {
                const routeTypeLabel = getRouteTypeLabel(item.routeType);
                const checked = selectedRouteIds.includes(item.busRouteId);

                return (
                  <li
                    key={item.busRouteId}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        handleToggle(
                          {
                            busRouteId: item.busRouteId,
                            busRouteAbrv: item.busRouteAbrv,
                            routeType: item.routeType,
                            adirection: item.adirection,
                          },
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4 shrink-0 accent-blue-500"
                    />
                    <div className="flex shrink-0 flex-col items-center gap-0.5">
                      <span
                        className="rounded px-2 py-0.5 text-xs font-bold text-white"
                        style={{ backgroundColor: getRouteTypeColor(item.routeType) }}
                      >
                        {item.busRouteAbrv}
                      </span>
                      {routeTypeLabel && (
                        <span className="text-[10px] text-gray-400">
                          {routeTypeLabel}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-gray-400">
                        {item.adirection} 방면
                      </p>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        {hasArrival(item.arrmsg1) && (
                          <p
                            className={cn(
                              'text-sm font-semibold',
                              isImminent(item.arrmsg1)
                                ? 'text-red-400'
                                : 'text-white',
                            )}
                          >
                            {item.arrmsg1}
                          </p>
                        )}
                        {hasArrival(item.arrmsg2) && (
                          <p
                            className={cn(
                              'text-xs',
                              isImminent(item.arrmsg2)
                                ? 'text-red-400'
                                : 'text-gray-400',
                            )}
                          >
                            {item.arrmsg2}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </BottomSheet.Content>
    </BottomSheet>
  );
};
