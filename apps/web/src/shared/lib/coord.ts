/** GPS 미확보(0인 경우) 좌표는 아프리카 앞바다를 가리키므로 null을 반환한다 */
export const parseCoord = (value: string): number | null => {
  const parsed = parseFloat(value);

  return Number.isNaN(parsed) || parsed === 0 ? null : parsed;
};
