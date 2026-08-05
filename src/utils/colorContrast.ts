/**
 * WCAG relative luminance / contrast ratio helpers, used to flag
 * low-contrast "reject cookies" buttons and tiny/faint billing text.
 */

interface RGB {
  r: number
  g: number
  b: number
  a: number
}

/** Parses `rgb()`, `rgba()`, or hex strings returned by getComputedStyle. */
export function parseColor(input: string): RGB | null {
  const rgbMatch = input.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i)
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] !== undefined ? Number(rgbMatch[4]) : 1,
    }
  }
  const hexMatch = input.match(/^#([0-9a-f]{3,8})$/i)
  const hex = hexMatch?.[1]
  if (hex) {
    if (hex.length === 3) {
      const [hr, hg, hb] = [hex[0]!, hex[1]!, hex[2]!]
      const r = parseInt(hr + hr, 16)
      const g = parseInt(hg + hg, 16)
      const b = parseInt(hb + hb, 16)
      return { r, g, b, a: 1 }
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      return { r, g, b, a }
    }
  }
  return null
}

function relativeLuminance({ r, g, b }: RGB): number {
  const channel = (c: number) => {
    const srgb = c / 255
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4)
  }
  const [rl, gl, bl] = [channel(r), channel(g), channel(b)]
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

/** Standard WCAG contrast ratio between two colors, ranges 1 (none) to 21 (max). */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Approximates the *effective* text-vs-background contrast for an element,
 * blending the text color's own alpha against its computed background.
 * Blending against black/white background isn't attempted here — we walk
 * up to the nearest opaque ancestor background in `getEffectiveBackground`.
 */
export function getEffectiveContrast(el: Element): number | null {
  const style = getComputedStyle(el)
  const fg = parseColor(style.color)
  const bg = getEffectiveBackground(el)
  if (!fg || !bg) return null
  return contrastRatio(fg, bg)
}

export function getEffectiveBackground(el: Element): RGB | null {
  let current: Element | null = el
  while (current) {
    const style = getComputedStyle(current)
    const bg = parseColor(style.backgroundColor)
    if (bg && bg.a > 0.5) return bg
    current = current.parentElement
  }
  return { r: 255, g: 255, b: 255, a: 1 }
}
