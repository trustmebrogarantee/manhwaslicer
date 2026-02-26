import { Events } from "./events";
import { Vector2 } from "./vector2";

export type KeyboardEvents = {
  escape: KeyboardEvent;
};


export class Keyboard {
  public events: Events<KeyboardEvents>;

  public position = new Vector2();
  public previous = new Vector2();
  public delta = new Vector2();

  constructor () {
    this.events = new Events<KeyboardEvents>();
    this.init();
  }

  private init() {
    this.events = this.events.extendDOM(
      "escape",
      window,
      "keydown",
      (e) => {
        if (e.key !== 'Escape') return null
        return e;
      }
    );
  }

  on<K extends keyof KeyboardEvents>(
    type: K,
    handler: (payload: KeyboardEvents[K]) => void
  ) {
    this.events.on(type, handler);
  }

  off<K extends keyof KeyboardEvents>(
    type: K,
    handler: (payload: KeyboardEvents[K]) => void
  ) {
    this.events.off(type, handler);
  }

  destroy() {
    this.events.destroy();
  }
}