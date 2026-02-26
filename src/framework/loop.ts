import mitt, { type Emitter } from "mitt";

export type LoopEvents = { 'frame': number }

export class Loop {
  ee: Emitter<LoopEvents> = mitt()
  on = this.ee.on
  emit = this.ee.emit

  animationId: null | number = null;
  running = false;
  destroyed = false;

  private lastTime = performance.now()

  run() {
    if (this.destroyed) throw new Error('Canvas has been destroyed');
    if (this.running) return
    this.running = true;
    this.lastTime = performance.now()
    this._loop();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.running = false;
  }

  protected _loop = () => {
    const now = performance.now()
    const dt = (now - this.lastTime) / 1000
    this.lastTime = now

    this.emit('frame', dt)

    if (this.running) {
      this.animationId = requestAnimationFrame(this._loop);
    }
  }
}
