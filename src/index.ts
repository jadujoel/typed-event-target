/// <reference types="@types/web" />

export interface TypedEvent<TType extends string = string, TDetail = unknown> {
  readonly type: TType
  readonly detail: TDetail
  readonly details?: TDetail
}

export type TypedEventRecord<
  TType extends string = string,
  TDetails = unknown,
> = {
  [K in TType]: TDetails
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

type EventDetailsMap = Record<string, unknown>
type EventName<TRecord extends EventDetailsMap> = Extract<keyof TRecord, string>
type EventFor<
  TRecord extends EventDetailsMap,
  TType extends EventName<TRecord>,
> = TypedEvent<TType, TRecord[TType]>

type DispatchableEvent<TType extends string = string, TDetail = unknown> = {
  readonly type: TType
  readonly detail?: TDetail
  readonly details?: TDetail
}

function normalizeTypedEvent(event: DispatchableEvent<string, unknown>) {
  const detail = "detail" in event
    ? event.detail
    : "details" in event
      ? event.details
      : undefined

  return {
    ...(event as object),
    type: event.type,
    detail,
    details: detail,
  } as TypedEvent<string, unknown>
}

export class TypedEventTarget<
  TRecord extends EventDetailsMap = Record<string, unknown>,
> {
  public readonly map: Map<EventName<TRecord>, ListenerArray> = new Map()

  static fromRecord<TRecord extends EventDetailsMap>(): TypedEventTarget<TRecord> {
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

    const normalizedEvent = normalizeTypedEvent(event) as EventFor<TRecord, TType>

    for (const [listener, once] of [...listeners]) {
      if (typeof listener === "function") {
        listener(normalizedEvent)
      } else {
        listener.handleEvent(normalizedEvent)
      }

      if (once) {
        this.removeEventListener(type, listener)
      }
    }

    return true
  }

  dispatch<TType extends EventName<TRecord>>(type: TType, detail: TRecord[TType]): boolean {
    return this.dispatchEvent({ type, detail, details: detail })
  }

  hasListeners<TType extends EventName<TRecord>>(type: TType): boolean {
    return (this.map.get(type)?.length ?? 0) > 0
  }

  dispose(): void {
    this.map.clear()
  }
}

export type DetailType<
  Key extends string | number | symbol = string,
  Value = unknown,
> = Readonly<Record<Key, Value>>

export type NamesType = string

type TEventListener<Names extends NamesType, Detail extends DetailType> = (
  event: TCustomEvent<Names, Detail>,
) => void

interface TEventListenerObject<
  Names extends NamesType,
  Detail extends DetailType,
> {
  readonly handleEvent: (object: TCustomEvent<Names, Detail>) => void
}

export interface TCustomEvent<
  Names extends NamesType,
  Detail extends DetailType,
> extends TypedEvent<Names, Detail> {}

type TEventListenerOrTEventListenerObject<
  Names extends NamesType,
  Detail extends DetailType,
> = TEventListener<Names, Detail> | TEventListenerObject<Names, Detail>

export interface EventTargetable<
  Names extends NamesType = never,
  Detail extends DetailType = Record<never, never>,
> {
  readonly target: TEventTarget<Names, Detail>
}

export interface TEventTarget<
  Names extends NamesType,
  Detail extends DetailType = Record<never, never>,
> extends TypedEventTarget<Record<Names, Detail>> {}

export class TEventTarget<
  Names extends NamesType,
  Detail extends DetailType = Record<never, never>,
> extends TypedEventTarget<Record<Names, Detail>> {
  override dispatch(type: Names, detail: Detail): boolean {
    return super.dispatch(type as Extract<Names, string>, detail)
  }
}
