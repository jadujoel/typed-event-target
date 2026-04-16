/// <reference types="@types/web" />

export type PayloadType<
  Key extends PropertyKey = string,
  Value = unknown,
> = Readonly<Record<Key, Value>>

export type TypedEvent<
  TType extends string = string,
  TPayload extends PayloadType = PayloadType,
> = Readonly<{
  type: TType
} & TPayload>

export type TypedEventRecord<
  TType extends string = string,
  TPayload extends PayloadType = PayloadType,
> = {
  [K in TType]: TPayload
}

export type TypedEventListener<
  TTypedEvent extends TypedEvent = TypedEvent,
> = (event: TTypedEvent) => void

type TypedEventListenerObject<
  TTypedEvent extends TypedEvent = TypedEvent,
> = {
  readonly handleEvent: (event: TTypedEvent) => void
}

type ListenerEntry<TTypedEvent extends TypedEvent = TypedEvent> = readonly [
  TypedEventListener<TTypedEvent> | TypedEventListenerObject<TTypedEvent>,
  boolean,
]

export type ListenerArray<
  TTypedEvent extends TypedEvent = TypedEvent,
> = Array<ListenerEntry<TTypedEvent>>

export type ListenerMap<
  TListenerName extends string = string,
  TListeners extends ListenerArray = ListenerArray,
> = Map<TListenerName, TListeners>

type EventPayloadMap = Record<string, PayloadType>
type EventName<TRecord extends EventPayloadMap> = Extract<keyof TRecord, string>
type EventFor<
  TRecord extends EventPayloadMap,
  TType extends EventName<TRecord>,
> = TypedEvent<TType, TRecord[TType]>

type DispatchableEvent<
  TType extends string = string,
  TPayload extends PayloadType = PayloadType,
> = TypedEvent<TType, TPayload>

export class TypedEventTarget<
  TRecord extends EventPayloadMap = Record<string, PayloadType>,
> {
  public readonly map: Map<EventName<TRecord>, ListenerArray> = new Map()

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

  hasListeners<TType extends EventName<TRecord>>(type: TType): boolean {
    return (this.map.get(type)?.length ?? 0) > 0
  }

  dispose(): void {
    this.map.clear()
  }
}

export type NamesType = string

type TEventListener<Names extends NamesType, Payload extends PayloadType> = (
  event: TCustomEvent<Names, Payload>,
) => void

interface TEventListenerObject<
  Names extends NamesType,
  Payload extends PayloadType,
> {
  readonly handleEvent: (object: TCustomEvent<Names, Payload>) => void
}

export type TCustomEvent<
  Names extends NamesType,
  Payload extends PayloadType,
> = TypedEvent<Names, Payload>

type TEventListenerOrTEventListenerObject<
  Names extends NamesType,
  Payload extends PayloadType,
> = TEventListener<Names, Payload> | TEventListenerObject<Names, Payload>

export interface EventTargetable<
  Names extends NamesType = never,
  Payload extends PayloadType = Record<never, never>,
> {
  readonly target: TEventTarget<Names, Payload>
}

export interface TEventTarget<
  Names extends NamesType,
  Payload extends PayloadType = Record<never, never>,
> extends TypedEventTarget<Record<Names, Payload>> {}

export class TEventTarget<
  Names extends NamesType,
  Payload extends PayloadType = Record<never, never>,
> extends TypedEventTarget<Record<Names, Payload>> {
  override dispatch(type: Names, payload: Payload): boolean {
    return super.dispatch(type as Extract<Names, string>, payload)
  }
}

export function asTypedEventTarget<TRecord extends EventPayloadMap>(target: unknown): TypedEventTarget<TRecord> {
  return target as TypedEventTarget<TRecord>
}

/**
 * @example
 * ```ts
 * const node = asWithTypedEventTarget<{
 *   click:  {
 *     detail: {
 *       x: number;
 *       y: number
 *     }
 *   }
 * }>(document.createElement("div"))
 * node.addEventListener("click", (event) => {
 *  console.log(`Clicked at (${event.detail.x}, ${event.detail.y})`)
 * })
 * ```
 */
export function asWithTypedEventTarget<
  TRecord extends EventPayloadMap,
  const TTarget = unknown
> (target: TTarget): TTarget & TypedEventTarget<TRecord> {
  return target as TTarget & TypedEventTarget<TRecord>
}
