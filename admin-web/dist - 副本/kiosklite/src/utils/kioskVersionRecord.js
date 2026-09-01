export function normalizeKioskVersionSegment(s) {
  if (!s || typeof s !== 'object') {
    return { version: '', updateTime: '' };
  }
  const v = s.version != null && s.version !== '' ? String(s.version) : '';
  const time =
    typeof s.updateTime === 'string' && s.updateTime ? s.updateTime : '';
  return { version: v, updateTime: time };
}
