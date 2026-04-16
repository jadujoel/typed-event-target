/// <reference types="@types/web" />

export interface TypedEvent<TType extends string = string, TDetails = unknown> {
  readonly type: TType
  readonly details?: TDetails
}

interface ExampleRecord {
  click: {
    x: number
    y: number
  }
  keydown: {
    key: string
  }
}

export interface TypedEventRecord<TType extends string = string, TDetails = unknown> {
  [K in TType]: TypedEvent<K, TDetails>
}

export type TypedEventListener <
  TTypedEvent extends TypedEvent = TypedEvent
> = (event: TTypedEvent) => void

export type ListenerArray<
  TTypedEventListener extends TypedEventListener = TypedEventListener
> = Array<ReadonlyArray<[TTypedEventListener, boolean]>>

export type ListenerMap<
  TListenerName extends string = string,
  TListenerArray extends ListenerArray = ListenerArray
  > = Map<TListenerName, TListenerArray>

export class TypedEventTarget<
TListenerMap extends ListenerMap = ListenerMap,
> implements EventTarget {

  private constructor(
    public readonly map: TListenerMap = new Map() as TListenerMap
  ) {}

  addEventListener (
    type: string,
    listener: TypedEventListener,
    options?: { readonly once: boolean }
  ): void {
    const listeners = this.map
    const found = listeners.get(type)
    const once = options?.once ?? false
    if (found === undefined) {
      listeners.set(type, [[listener, once]])
    } else {
      found.push([listener, once])
    }
  }

  removeEventListener(type: string, listener: TypedEventListener): void {
    const listeners = this.map.get(type)
    if (listeners === undefined) {
      return
    }
    for (let i = 0; i < listeners.length; i++) {
      const callback = listeners[i]![0]!
      if (callback === listener) {
        listeners.splice(i, 1)
        return
      }
    }
  }

  dispatchEvent(event: TypedEvent): boolean {
    const type = event.type
    const found = this.map.get(type)
    if (found === undefined) {
      return true
    }
    for (let i = 0; i < found.length; i++) {
      const [callback, once] = found[i]!
      callback(event)
      if (once) {
        this.removeEventListener(type, callback)
        i--
      }
    }
    return true
  }

  dispose(): void {
    this.map.clear()
  }
}

// The T stands for "Typed" to distinguish it from the native EventTarget / CustomEvent etc.

/**
 * A type representing a detail for the custom event.
 * @typeParam Key - The keys for the detail type, can be string, number, or symbol.
 * @typeParam Value - The value of the detail, default is any.
 */
export type DetailType<
  Key extends string | number | symbol = string,
  Value = any
> = Readonly<Record<Key, Value>>

/**
 * A type representing the names for the custom event, default is string.
 */
export type NamesType = string

/**
 * A type representing a listener for the custom event.
 * @typeParam Names - The names for the custom event.
 * @typeParam Details - The detail type for the custom event.
 */
type TEventListener<Names extends NamesType, Details extends DetailType> = (
  event: TCustomEvent<Names, Details>
) => void

/**
 * An interface representing an event listener object.
 * @typeParam Names - The names for the custom event.
 * @typeParam Details - The detail type for the custom event.
 */
interface TEventListenerObject<
  Names extends NamesType,
  Details extends DetailType
> {
  /**
   * Method that handles custom events.
   * @param object - A custom event of type TCustomEvent.
   * @example
   * const listenerObject: TEventListenerObject<string, DetailType> = {
   *   handleEvent: (object) => {
   *     console.log(`Event of type ${object.type} handled.`);
   *   }
   * }
   * listenerObject.handleEvent(new TCustomEvent("eventType", {detail: "Some detail"}));
   */
  readonly handleEvent: (object: TCustomEvent<Names, Details>) => void
}

export interface TCustomEvent<
  Names extends NamesType,
  Detail extends DetailType
> {
  readonly type: Names[number]
  readonly detail: Detail
}

type TEventListenerOrTEventListenerObject<
  Names extends NamesType,
  Detail extends DetailType
> = TEventListener<Names, Detail> | TEventListenerObject<Names, Detail>

/**
 * An interface representing a targetable event, used for subscribing and unsubscribing to events.
 * @typeParam Names - The names for the custom event.
 * @typeParam Detail - The detail type for the custom event.
 */
export interface EventTargetable<
  Names extends NamesType = never,
  Detail extends DetailType = Record<never, never>
> {
  readonly target: TEventTarget<Names, Detail>
}

/**
 * Exactly like EventTarget but specifies what event names are available and what detail can be provided, implements EventTarget
 * @typeParam Names - The names for the custom event.
 * @typeParam Detail - The detail type for the custom event.
 */
export interface TEventTarget<
  Names extends NamesType,
  Detail extends DetailType = Record<never, never>
> {
  /**
   * Adds an event listener to the target.
   *
   * @param type - The type of the event.
   * @param listener - The listener function or object that responds to the event.
   * @param options - An options object that specifies characteristics about the event listener.
   *
   * @example
   *
   * const target: TEventTarget<string, DetailType> = new TEventTarget();
   *
   * target.addEventListener("eventType", (event) => {
   *   console.log(`Event of type ${event.type} handled.`);
   * }, false);
   */
  readonly addEventListener: (
    type: Names,
    listener: TEventListenerOrTEventListenerObject<Names, Detail> | null,
    options?: boolean | AddEventListenerOptions
  ) => void
  /**
   * Dispatches an event at the event target.
   * @param event - A custom event of type TCustomEvent.
   * @returns - A boolean that indicates whether the event was cancelled.
   * @example
   * const target: TEventTarget<string, DetailType> = new TEventTarget();
   * const eventDispatched = target.dispatchEvent(new TCustomEvent("eventType", {detail: "Some detail"}));
   * console.log(`Event was ${eventDispatched ? "not cancelled" : "cancelled"}`);
   */
  readonly dispatchEvent: (event: TCustomEvent<Names, Detail>) => boolean
  /**
   * Removes an event listener from the target.
   * @param type - The type of the event.
   * @param listener - The listener function or object that was added to the target.
   * @param options - An options object that specifies characteristics about the event listener.
   *
   * @example
   * const target: TEventTarget<string, DetailType> = new TEventTarget();
   * const listener = (event) => {
   *   console.log(`Event of type ${event.type} handled.`);
   * };
   *
   * target.addEventListener("eventType", listener, false);
   * target.removeEventListener("eventType", listener, false);
   */
  readonly removeEventListener: (
    type: Names,
    listener: TEventListenerOrTEventListenerObject<Names, Detail> | null,
    options?: boolean | EventListenerOptions
  ) => void
}

/**
 * A class representing a custom Typed EventTarget, extends EventTarget.
 * Adds small conveniences like dispatching an event by name and detail instead of creating a new CustomEvent manually
 * @typeParam Names - The names for the custom event.
 * @typeParam Detail - The detail type for the custom event.
 **/
export class TEventTarget<Names extends NamesType, Detail extends DetailType>
  extends TypedEventTarget
  implements TEventTarget<Names, Detail>
{
  /**
   * Dispatches a custom event at the current time.
   *
   * @param type - The type of the event.
   * @param detail - The detail of the event.
   * @returns - The return value is a boolean that is "true" if the event was successfully dispatched.
   * @example
   * const target: TEventTarget<string, DetailType> = new TEventTarget();
   * const eventDispatched = target.dispatch("eventType", {detail: "Some detail"});
   * console.log(`Event was ${eventDispatched ? "not cancelled" : "cancelled"}`);
   */
  dispatch(type: Names, detail: Detail): boolean {
    // no need to dispatch if there are no listeners
    if (this.map.get(type) === undefined) {
      return true
    }
    return this.dispatchEvent({ type, detail })
  }
}
