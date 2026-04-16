/// <reference types="@types/web" />

export type PayloadType<
  Key extends PropertyKey = string,
  Value = unknown,
> = Readonly<Record<Key, Value>>

export type TypedEvent<
  TType extends string = string,
  TPayload extends PayloadType = PayloadType,
> = {
  readonly type: TType
} & Readonly<TPayload>

export type TypedEventListener<
  TTypedEvent extends TypedEvent = TypedEvent,
> = (event: TTypedEvent) => void

export type TypedEventListenerObject<
  TTypedEvent extends TypedEvent = TypedEvent,
> = {
  readonly handleEvent: (event: TTypedEvent) => void
}

export type ListenerEntry<TTypedEvent extends TypedEvent = TypedEvent> = readonly [
  TypedEventListener<TTypedEvent> | TypedEventListenerObject<TTypedEvent>,
  boolean,
]

export type ListenerArray<
  TTypedEvent extends TypedEvent = TypedEvent,
> = Array<ListenerEntry<TTypedEvent>>

export type EventPayloadMap<
  TNames extends string = string
> = Record<TNames, PayloadType>

export type EventName<
  TRecord extends EventPayloadMap
> = Extract<keyof TRecord, string>

export type EventFor<
  TRecord extends EventPayloadMap,
  TType extends EventName<TRecord>,
> = TypedEvent<TType, TRecord[TType]>

export type DispatchableEvent<
  TType extends string = string,
  TPayload extends PayloadType = PayloadType,
> = TypedEvent<TType, TPayload>


export type NamesType = string

export class TypedEventTarget<
  TRecord extends EventPayloadMap = Record<string, PayloadType>,
> {

  constructor (
    public readonly map: Map<EventName<TRecord>, ListenerArray> = new Map()
  ) {}

  static default<TRecord extends EventPayloadMap>(): TypedEventTarget<TRecord> {
    return new TypedEventTarget<TRecord>()
  }

  static from<TRecord extends EventPayloadMap>(): TypedEventTarget<TRecord> {
    return new TypedEventTarget<TRecord>()
  }

  static fromRecord<TRecord extends EventPayloadMap>(): TypedEventTarget<TRecord> {
    return new TypedEventTarget<TRecord>()
  }

  addEventListener<TType extends EventName<TRecord>>(
    type: TType,
    listener:
      | TypedEventListener<EventFor<TRecord, TType>>
      | TypedEventListenerObject<EventFor<TRecord, TType>>
      | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (listener === null) {
      return
    }

    const once = typeof options === "boolean" ? false : options?.once ?? false
    const listeners = this.map.get(type) ?? []
    listeners.push([listener as TypedEventListener | TypedEventListenerObject, once])
    this.map.set(type, listeners)
  }

  removeEventListener<TType extends EventName<TRecord>>(
    type: TType,
    listener:
      | TypedEventListener<EventFor<TRecord, TType>>
      | TypedEventListenerObject<EventFor<TRecord, TType>>
      | null,
    _options?: boolean | EventListenerOptions,
  ): void {
    if (listener === null) {
      return
    }

    const listeners = this.map.get(type)
    if (listeners === undefined) {
      return
    }

    for (let index = 0; index < listeners.length; index++) {
      const [candidate] = listeners[index]!
      if (candidate === listener) {
        listeners.splice(index, 1)
        break
      }
    }

    if (listeners.length === 0) {
      this.map.delete(type)
    }
  }

  dispatchEvent<TType extends EventName<TRecord>>(
    event: DispatchableEvent<TType, TRecord[TType]>,
  ): boolean {
    const type = event.type
    const listeners = this.map.get(type)

    if (listeners === undefined || listeners.length === 0) {
      return true
    }

    const typedEvent = event as EventFor<TRecord, TType>

    for (const [listener, once] of [...listeners]) {
      if (typeof listener === "function") {
        listener(typedEvent)
      } else {
        listener.handleEvent(typedEvent)
      }

      if (once) {
        this.removeEventListener(type, listener)
      }
    }

    return true
  }

  dispatch<TType extends EventName<TRecord>>(type: TType, payload: TRecord[TType]): boolean {
    return this.dispatchEvent({ type, ...payload })
  }

  emit<TType extends EventName<TRecord>>(event: DispatchableEvent<TType, TRecord[TType]>): boolean
  emit<TType extends EventName<TRecord>>(type: TType, payload: TRecord[TType]): boolean
  emit<TType extends EventName<TRecord>>(
    typeOrEvent: TType | DispatchableEvent<TType, TRecord[TType]>,
    payload?: TRecord[TType],
  ): boolean {
    if (typeof typeOrEvent === "string") {
      return this.dispatch(typeOrEvent, payload as TRecord[TType])
    }

    return this.dispatchEvent(typeOrEvent)
  }

  hasListeners<TType extends EventName<TRecord>>(type: TType): boolean {
    return (this.map.get(type)?.length ?? 0) > 0
  }

  dispose(): void {
    this.map.clear()
  }
}

export function asTypedEventTarget<TRecord extends EventPayloadMap>(target: unknown): TypedEventTarget<TRecord> {
  return target as TypedEventTarget<TRecord>
}

/**
 * @example
 * ```ts
 * const node = asWithTypedEventTarget<{
 *   click: { clientX: number; clientY: number }
 * }>(document.createElement("div"))
 *
 * node.addEventListener("click", (event) => {
 *   console.log(`Clicked at (${event.clientX}, ${event.clientY})`)
 * })
 * ```
 */
export function asWithTypedEventTarget<
  TRecord extends EventPayloadMap,
  const TTarget = unknown
> (target: TTarget): TTarget & TypedEventTarget<TRecord> {
  return target as TTarget & TypedEventTarget<TRecord>
}

export default TypedEventTarget
