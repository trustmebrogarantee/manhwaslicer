type Options = {
  min?: number
  max?: number
}

export class InterpolatedNumber {
  private _value: number
  public target: number
  private _alpha: number
  private min: number | undefined
  private max: number | undefined

  constructor(initial: number, alpha: number, opts?: Options) {
    this._value = initial
    this.target = initial
    this._alpha = alpha
    this.min = opts?.min
    this.max = opts?.max
  }

  get value() {
    return this._value
  }

  set value(v: number) {
    this.target = v
    if (typeof this.min === 'number') this.target = Math.max(this.target, this.min)
    if (typeof this.max === 'number') this.target = Math.min(this.target, this.max)
  }

  update(dt: number) {
    const t = 1 - Math.exp(-this._alpha * dt)
    this._value = this._value * (1 - t) + this.target * t
  }
}

export const interpolated = (initial: number, alpha = 10, opts?: Options) =>
  new InterpolatedNumber(initial, alpha, opts)
