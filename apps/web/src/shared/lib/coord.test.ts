import { describe, expect, it } from 'vitest';

import { parseCoord } from './coord';

describe('parseCoord', () => {
  it('좌표 문자열을 숫자로 바꾼다', () => {
    expect(parseCoord('37.5662952')).toBe(37.5662952);
    expect(parseCoord('126.9779451')).toBe(126.9779451);
  });

  it('숫자가 아니면 null을 돌려준다', () => {
    expect(parseCoord('')).toBeNull();
    expect(parseCoord('N/A')).toBeNull();
  });

  it('0은 좌표로 쓸 수 없어 null을 돌려준다', () => {
    expect(parseCoord('0')).toBeNull();
    expect(parseCoord('0.0')).toBeNull();
  });
});
