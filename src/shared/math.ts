export const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a
export const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max))