import { Keyboard } from "./keyboard";
import { Loop } from "./loop";
import { Mouse } from "./mouse";

export { interpolated, InterpolatedNumber } from "./interpolated"

export class Framework {
  public loop: Loop = new Loop()
  public keyboard = new Keyboard()
  public mouse: Mouse
  public ctx: CanvasRenderingContext2D

  constructor (
    protected container: HTMLElement,
    protected canvas: HTMLCanvasElement
  ) {
    this.mouse = new Mouse(this.container, this.canvas)
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
  }

  start () {
    this.loop.run()
  }
  
  destroy () {
    this.mouse.events.destroy()
    this.loop.stop()
    this.canvas.parentNode?.removeChild(this.canvas);
  }
}
