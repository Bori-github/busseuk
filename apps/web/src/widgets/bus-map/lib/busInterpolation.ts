/**
 * 버스 마커 부드러운 이동을 위한 "지연 재생 보간(interpolation buffer)" 모델.
 *
 * 위치 데이터는 약 5초 주기 · 일반 GPS로만 들어온다. 미래를 추정(extrapolation)하면
 * 버스가 신호·정류장에서 감속할 때 마커가 앞질러 갔다가 되돌아오는 오실레이션이 생긴다.
 * 그래서 여기서는 **미래를 예측하지 않고, 이미 받은 두 실측 사이만 보간**한다:
 *   - 관측을 {s, t} 버퍼에 쌓고,
 *   - 화면은 실시간보다 조금 뒤인 재생 클럭(playTime)을 두며,
 *   - playTime을 사이에 두는 두 실측을 선형 보간한다.
 * 최신 실측을 절대 앞지르지 않으므로 오버슈트·백트래킹이 원천 제거되고,
 * 예측이 아니라 실측을 그대로 재생하므로 실제 교통(정차 포함)이 자연히 반영된다.
 * 재생 클럭은 목표 지연(TARGET_LAG_MS)을 유지하되, 초과 지연이 쌓이면 잠깐 >1배속으로
 * 부드럽게 회수(캐치업)해 평균 지연을 낮춘다. 사용자는 지연을 인지하지 못하고 부드러움만 체감한다.
 *
 * s는 "노선 시작점 기준 누적거리(m)"이며, 실제 좌표 샘플링은 위젯에서 pointAtDistance로 한다
 * (이 파일은 naver 의존 없이 테스트 가능).
 */

/**
 * 목표 재생 지연(ms). 재생 클럭이 유지하려는 실시간 대비 지연.
 * 폴 간격(5s)과 같게 두면 여유가 0이라, 폴이 조금만 늦어도(프록시·네트워크 지터)
 * 재생 클럭이 최신 실측을 따라잡아 언더런→정지→점프(스터터)가 반복된다.
 * 따라서 폴 간격 + 예상 지터만큼 여유를 둔다. 초과 지연은 캐치업(>1배속)으로 회수한다.
 */
export const TARGET_LAG_MS = 6_500;

/** 캐치업 최대 배속. 초과 지연을 회수할 때만 잠깐 이 배속까지 빨라진다. */
export const MAX_CATCHUP_RATE = 1.15;

/** 초과 지연 1초당 배속 증가량(상한 MAX_CATCHUP_RATE). */
export const CATCHUP_GAIN = 0.2;

/** 프레임 간격 상한(ms). 탭 백그라운드 복귀 시 클럭이 한 번에 크게 튀는 것을 막는다. */
export const MAX_FRAME_MS = 100;

/**
 * 현재 지연(lagMs = now − playTime)에 따른 재생 배속.
 * - 지연이 목표 이하면 등속(1배). 실시간보다 느려지지 않아 지연이 늘지 않는다.
 * - 목표 초과분만큼만 빨라져(캐치업) 부드럽게 회수하고, 상한에서 멈춘다.
 */
export const playbackRate = (lagMs: number, target: number = TARGET_LAG_MS): number => {
  const excessSeconds = (lagMs - target) / 1000;
  if (excessSeconds <= 0) return 1;
  return Math.min(1 + excessSeconds * CATCHUP_GAIN, MAX_CATCHUP_RATE);
};

/**
 * 재생 클럭을 한 프레임 전진시킨다. 최신 실측 시각(newestT)을 넘지 않도록 클램프해
 * 예측(=되돌아감)을 원천 차단한다. 넘어서면 새 데이터가 올 때까지 그 지점에서 정지(freeze).
 */
export const advancePlayTime = (
  playTime: number,
  dtMs: number,
  rate: number,
  newestT: number,
): number => Math.min(playTime + Math.max(dtMs, 0) * rate, newestT);

/**
 * 한 폴 사이 관측 이동거리가 이 값을 넘으면 GPS 점프/노이즈로 보고 버퍼를 리셋(스냅)한다.
 * 실데이터 측정 근거: 노선 100100118 16대의 ~5초간 이동거리 p90 ≈ 294m,
 * 정상 주행(도심 20~40km/h)은 5초에 30~70m. 300m 초과는 비현실적(>200km/h)이라 스냅.
 */
export const SNAP_THRESHOLD_M = 300;

/** 이보다 작은 후퇴는 GPS 지터로 보고 무시(정지로 간주)해 미세 떨림을 없앤다. */
export const JITTER_TOLERANCE_M = 5;

/** 관측 간격이 이보다 벌어지면(탭 백그라운드 등) 연속성이 끊긴 것으로 보고 버퍼를 리셋한다. */
export const STALE_GAP_MS = 15_000;

export interface Sample {
  /** 노선 누적거리(m) */
  s: number;
  /** 관측 시각(ms, performance.now 기준) */
  t: number;
}

/**
 * 새 관측을 버퍼에 추가한다(제자리 변경).
 * - 급점프(거리 임계 초과)·오랜 공백(시간 임계 초과): 버퍼를 비우고 새 샘플만 남겨 스냅한다.
 * - 미세 후퇴(지터): 직전 s로 눌러 정지로 처리한다.
 */
export const pushSample = (buffer: Sample[], s: number, t: number): void => {
  const last = buffer[buffer.length - 1];
  if (last !== undefined) {
    const teleport = Math.abs(s - last.s) > SNAP_THRESHOLD_M;
    const stale = t - last.t > STALE_GAP_MS;
    if (teleport || stale) {
      buffer.length = 0;
    } else {
      const delta = s - last.s;
      if (delta < 0 && -delta <= JITTER_TOLERANCE_M) s = last.s;
    }
  }
  buffer.push({ s, t });
};

/**
 * renderTime 시점의 보간된 s를 반환한다. 버퍼가 비면 null.
 * - renderTime이 가장 오래된 샘플보다 이르면 그 샘플에 고정(startup 대기).
 * - renderTime이 가장 최신 샘플보다 늦으면(언더런) 최신 샘플에 고정(예측하지 않음).
 * - 그 사이면 두 실측을 선형 보간한다.
 */
export const sampleAt = (buffer: Sample[], renderTime: number): number | null => {
  if (buffer.length === 0) return null;
  if (renderTime <= buffer[0].t) return buffer[0].s;

  const last = buffer[buffer.length - 1];
  if (renderTime >= last.t) return last.s;

  for (let i = buffer.length - 2; i >= 0; i -= 1) {
    if (buffer[i].t <= renderTime) {
      const a = buffer[i];
      const b = buffer[i + 1];
      const span = b.t - a.t;
      const frac = span > 0 ? (renderTime - a.t) / span : 0;
      return a.s + (b.s - a.s) * frac;
    }
  }
  return buffer[0].s;
};

/** renderTime보다 이전 구간은 더 필요 없으므로, 하위 브래킷 하나만 남기고 오래된 샘플을 버린다. */
export const pruneBuffer = (buffer: Sample[], renderTime: number): void => {
  let keepFrom = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i].t <= renderTime) keepFrom = i;
    else break;
  }
  if (keepFrom > 0) buffer.splice(0, keepFrom);
};

/** 아직 재생할(보간할) 구간이 남았는지 — rAF 루프 지속 판정. */
export const hasPendingPlayback = (
  buffer: Sample[],
  renderTime: number,
): boolean => buffer.length > 0 && renderTime < buffer[buffer.length - 1].t;
