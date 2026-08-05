/** Short, collision-resistant id — good enough for in-page pattern tracking. */
export function generateId(prefix = 'cg'): string {
  const random = Math.random().toString(36).slice(2, 9)
  const time = Date.now().toString(36)
  return `${prefix}_${time}_${random}`
}
