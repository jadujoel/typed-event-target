# typed-event-target

Tiny TypeScript helpers for strongly typed event emitters and DOM-style event targets.

## Why this library exists

The standard `EventTarget` API is great at runtime, but it gives very little type safety in TypeScript for:

- allowed event names
- event payload shape
- listener argument types

This library keeps the familiar `addEventListener`, `removeEventListener`, and `dispatchEvent` workflow while making event names and payloads fully typed.

## What you get

- strongly typed event names
- strongly typed event payloads
- a small custom event bus with a DOM-like API
- helpers for attaching typing to existing objects or DOM nodes
- support for `{ once: true }` listeners

## Install

```bash
bun add @jadujoel/typed-event-target
```

You can also use your preferred package manager:

```bash
npm install @jadujoel/typed-event-target
pnpm add @jadujoel/typed-event-target
yarn add @jadujoel/typed-event-target
```

## Basic usage

Create a typed event target by defining an event map where each key is an event name and each value is that event's payload.

```ts
import { TypedEventTarget } from "@jadujoel/typed-event-target"

type AppEvents = {
  ready: { startedAt: number }
  message: { text: string; from: string }
  error: { reason: string }
}

const events = TypedEventTarget.fromRecord<AppEvents>()

events.addEventListener("message", (event) => {
  console.log(event.type)   // "message"
  console.log(event.text)   // string
  console.log(event.from)   // string
})

events.dispatch("message", {
  text: "Hello",
  from: "system",
})
```

## How it works

When you call `dispatch`, the payload is merged onto the event object.

```ts
events.dispatch("ready", { startedAt: Date.now() })
```

The listener receives an object shaped like:

```ts
{ type: "ready", startedAt: 1710000000000 }
```

## Using once listeners

```ts
const target = TypedEventTarget.fromRecord<{
  connected: { userId: string }
}>()

target.addEventListener("connected", (event) => {
  console.log("Connected:", event.userId)
}, { once: true })

target.dispatch("connected", { userId: "u_1" })
target.dispatch("connected", { userId: "u_1" }) // listener will not run again
```

## Removing listeners

```ts
const target = TypedEventTarget.fromRecord<{
  change: { value: number }
}>()

const onChange = (event: { type: "change"; value: number }) => {
  console.log(event.value)
}

target.addEventListener("change", onChange)
target.removeEventListener("change", onChange)
```

## Typing an existing DOM element or object

If you already have a target-like object and want typed listeners, you can cast it with `asWithTypedEventTarget`.

```ts
import { asWithTypedEventTarget } from "@jadujoel/typed-event-target"

const button = asWithTypedEventTarget<{
  click: { clientX: number; clientY: number }
}>(document.createElement("button"))

button.addEventListener("click", (event) => {
  console.log(event.clientX, event.clientY)
})
```

This is especially useful when working with browser elements, custom elements, or framework-owned objects that already behave like event targets.

## Dispatching full event objects

If you already have a complete event object, you can dispatch it directly.

```ts
const target = TypedEventTarget.fromRecord<{
  saved: { id: string }
}>()

target.dispatchEvent({
  type: "saved",
  id: "42",
})
```

## API overview

### `TypedEventTarget<TRecord>`

Main class for creating typed event targets.

Common methods:

- `addEventListener(type, listener, options?)`
- `removeEventListener(type, listener)`
- `dispatch(type, payload)`
- `dispatchEvent(event)`
- `hasListeners(type)`
- `dispose()`

### `TypedEventTarget.fromRecord<TRecord>()`

Convenience factory for creating a typed instance.

### `asTypedEventTarget<TRecord>(target)`

Casts an existing object to a typed event target.

### `asWithTypedEventTarget<TRecord>(target)`

Returns the original object with typed event-target behavior attached at the type level.

### `TEventTarget`

Legacy wrapper maintained for the simpler “one payload type for all event names” style.

## When to use this library

Use it when you want:

- lightweight typed eventing without bringing in a larger state library
- safer event-driven code in TypeScript
- autocomplete for event names and payload fields
- DOM-style APIs for app-internal events

## Development

Run the example locally:

```bash
bun example.ts
```

Run tests:

```bash
bun test
```
