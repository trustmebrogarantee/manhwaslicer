import mitt, { type Emitter } from "mitt";

type EventMap = Record<string, any>;

export class Events<EM extends EventMap = {}> {
  private emitter: Emitter<EM>;
  private controllers = new Map<keyof EM, AbortController>();

  constructor(emitter?: Emitter<EM>) {
    this.emitter = emitter ?? mitt<EM>();
  }

  on<K extends keyof EM>(type: K, handler: (payload: EM[K]) => void) {
    this.emitter.on(type, handler);
  }

  off<K extends keyof EM>(type: K, handler: (payload: EM[K]) => void) {
    this.emitter.off(type, handler);
  }
  extendDOM<
    Key extends string,
    DOMKey extends keyof GlobalEventHandlersEventMap,
    Payload
  >(
    key: Key,
    target: EventTarget,
    domEvent: DOMKey,
    transform: (event: GlobalEventHandlersEventMap[DOMKey]) => Payload,
    options?: AddEventListenerOptions
  ): Events<EM & Record<Key, Payload>> {

    const typedEmitter = this.emitter as Emitter<
      EM & Record<Key, Payload>
    >;

    const typedControllers = this.controllers as Map<
      keyof (EM & Record<Key, Payload>),
      AbortController
    >;

    // Abort previous if exists
    typedControllers.get(key)?.abort();

    const controller = new AbortController();
    typedControllers.set(key, controller);

    target.addEventListener(
      domEvent,
      (event) => {
        const payload = transform(
          event as GlobalEventHandlersEventMap[DOMKey]
        );
        if (payload) typedEmitter.emit(key as any, payload as any);
      },
      { ...options, signal: controller.signal }
    );

    return new Events<EM & Record<Key, Payload>>(typedEmitter);
  }

  abort<K extends keyof EM>(key: K) {
    this.controllers.get(key)?.abort();
  }

  destroy() {
    for (const controller of this.controllers.values()) {
      controller.abort();
    }
    this.controllers.clear();
  }
}