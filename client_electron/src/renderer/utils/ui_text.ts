export const should_ellipsis = (text: string, max_chars: number = 4): boolean => {
  const normalized = (text || '').replace(/\s+/g, '')
  return normalized.length > max_chars
}

export const to_fixed_chars = (text: string, target_chars: number = 4, suffix: string = ''): string => {
  const raw = String(text || '')
  const normalized = raw.replace(/\s+/g, '')
  if (normalized.length >= target_chars) return raw
  const filled = `${normalized}${suffix}`
  return filled.length >= target_chars ? filled.slice(0, target_chars) : filled
}
