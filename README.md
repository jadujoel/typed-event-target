# typed-event-target

Tiny TypeScript helpers for strongly typed event targets.

## Why this exists

The standard DOM event API works well at runtime, but TypeScript usually cannot enforce:

- which event names are allowed
- which payload fields belong to each event
- which listener argument shape you receive

This package keeps the familiar event-target style API while making those parts strongly typed.

## Features

- typed event names
- typed payload objects
- familiar `addEventListener`, `removeEventListener`, and `dispatchEvent` style usage
- support for `{ once: true }` listeners
- helpers for casting existing objects or DOM nodes to typed targets

## Install

```bash
bun add @jadujoel/typed-event-target
```

Other package managers also work:

```bash
npm install @jadujoel/typed-event-target
pnpm add @jadujoel/typed-event-target
yarn add @jadujoel/typed-event-target
```

## Quick start

Define an event map where each key is the event name and each value is the payload object for that event.

```ts
import { TypedEventTarget } from "@jadujoel/typed-event-target"

type AppEvents = {
  ready: { startedAt: number }
  message: { text: string; from: string }
  error: { reason: string }
}

const target = TypedEventTarget.from<AppEvents>()

target.addEventListener("message", (event) => {
  console.log(event.type)
  console.log(event.text)
  console.log(event.from)
})

target.dispatch("message", {
  text: "Hello",
  from: "system",
})
```

When you call `dispatch`, the payload is merged onto a plain event object with a `type` field.

```ts
target.dispatch("ready", { startedAt: Date.now() })
```

The listener receives data shaped like this:

```ts
{ type: "ready", startedAt: 1710000000000 }
```

## Once listeners

```ts
const target = TypedEventTarget.from<{
  connected: { userId: string }
}>()

target.addEventListener("connected", (event) => {
  console.log("Connected:", event.userId)
}, { once: true })

target.dispatch("connected", { userId: "u_1" })
target.dispatch("connected", { userId: "u_1" })
```

## Removing listeners

```ts
const target = TypedEventTarget.from<{
  change: { value: number }
}>()

const onChange = (event: { type: "change"; value: number }) => {
  console.log(event.value)
}

target.addEventListener("change", onChange)
target.removeEventListener("change", onChange)
```

## Dispatching a full event object

If you already have the complete event object, you can pass it directly.

```ts
const target = TypedEventTarget.from<{
  saved: { id: string }
}>()

target.emit({
  type: "saved",
  id: "42",
})
```

## Typing an existing target or DOM node

Use the casting helpers when the runtime object already behaves like an event target and you want better TypeScript support.

```ts
import { asTypedEventTarget, asWithTypedEventTarget } from "@jadujoel/typed-event-target"

const button = document.createElement("button")

const typedButton = asTypedEventTarget<{
  click: { clientX: number; clientY: number }
}>(button)

typedButton.addEventListener("click", (event) => {
  console.log(event.clientX, event.clientY)
})

const sameButton = asWithTypedEventTarget<{
  click: { clientX: number; clientY: number }
}>(button)

sameButton.addEventListener("click", (event) => {
  console.log(event.clientX, event.clientY)
})
```

> These helpers are type-level casts. They do not add runtime event behavior to plain objects.

## API overview

### Main class

- `TypedEventTarget<TRecord>`
- `new TypedEventTarget()`
- `TypedEventTarget.default<TRecord>()`
- `TypedEventTarget.from<TRecord>()`

### Instance methods

- `addEventListener(type, listener, options?)`
- `removeEventListener(type, listener)`
- `dispatch(type, payload)`
- `emit(event)` or `emit(type, payload)`
- `dispatchEvent(event)`
- `hasListeners(type)`
- `dispose()`

### Helper functions

- `asTypedEventTarget<TRecord>(target)`
- `asWithTypedEventTarget<TRecord>(target)`

### Exported types

- `TypedEvent`
- `TypedEventListener`
- `TypedEventListenerObject`
- `EventFor`
- `EventPayloadMap`

## When to use it

This package is a good fit when you want:

- lightweight typed eventing
- autocomplete for event names and payload fields
- a small event utility without a larger framework dependency
- DOM-style patterns for internal app events

## Development

Install dependencies:

```bash
bun install
```

Run the example:

```bash
bun example.ts
```

Run tests:

```bash
bun test
```

Build the package:

```bash
bun run build
```
