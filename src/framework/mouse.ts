import { Events } from "./events";
import { Vector2 } from "./vector2";

export type MouseEvents = {
  move: {
    position: Vector2;
    delta: Vector2;
  };
  wheel: {
    delta: number;
    position: Vector2;
  };
  leftClick: {
    position: Vector2;
  };
  rightClick: {
    position: Vector2;
  };
};


export class Mouse {
  public events: Events<MouseEvents>;

  public position = new Vector2();
  public previous = new Vector2();
  public delta = new Vector2();

  constructor(
    private container: HTMLElement,
    private canvas: HTMLCanvasElement
  ) {
    this.events = new Events<MouseEvents>();
    this.init();
  }

  private init() {
    this.events = this.events.extendDOM(
      "move",
      this.container,
      "mousemove",
      (e) => {
        const rect = this.canvas.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.previous.copy(this.position);
        this.position.set(x, y);

        this.delta = Vector2.subtract(this.position, this.previous);

        return {
          position: this.position.clone(),
          delta: this.delta.clone()
        };
      }
    );

    this.events = this.events.extendDOM(
      "wheel",
      this.container,
      "wheel",
      (e) => ({
        delta: e.deltaY,
        position: this.position.clone()
      }),
      { passive: true }
    );

    this.events = this.events.extendDOM(
      "leftClick",
      this.container,
      "mousedown",
      (e) => {
        if (e.button !== 0) return null as any;

        return {
          position: this.position.clone()
        };
      }
    );

    this.events = this.events.extendDOM(
      "rightClick",
      this.container,
      "contextmenu",
      (e) => {
        e.preventDefault();
        return {
          position: this.position.clone()
        };
      }
    );
  }

  on<K extends keyof MouseEvents>(
    type: K,
    handler: (payload: MouseEvents[K]) => void
  ) {
    this.events.on(type, handler);
  }

  off<K extends keyof MouseEvents>(
    type: K,
    handler: (payload: MouseEvents[K]) => void
  ) {
    this.events.off(type, handler);
  }

  destroy() {
    this.events.destroy();
  }
}