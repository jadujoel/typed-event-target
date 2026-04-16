import { expect, test } from "bun:test"
import { Window } from "happy-dom"
import DefaultTypedEventTarget, {
  TypedEventTarget,
  asWithTypedEventTarget,
} from "./index"

test("flattens object payload onto the event", () => {
  const target = TypedEventTarget.from<{
    click: { x: number; y: number }
  }>()

  let seen: { x: number; y: number } | undefined

  target.addEventListener("click", ({ x, y, type }) => {
    seen = { x, y }
    expect(type).toBe("click")
  })

  target.dispatch("click", { x: 10, y: 20 })

  expect(seen).toEqual({ x: 10, y: 20 })
})

test("dispatches a typed event to listeners", () => {
  const target = TypedEventTarget.from<{
    click: { x: number; y: number }
    keydown: { key: string }
  }>()

  const received: Array<{ x: number; y: number }> = []

  target.addEventListener("click", (event) => {
    received.push({ x: event.x, y: event.y })
  })

  const result = target.dispatch("click", { x: 10, y: 20 })

  expect(result).toBe(true)
  expect(received).toEqual([{ x: 10, y: 20 }])
})

test("supports once listeners", () => {
  const target = TypedEventTarget.from<{
    ready: { ok: boolean }
  }>()

  let count = 0

  target.addEventListener("ready", () => {
    count += 1
  }, { once: true })

  target.dispatch("ready", { ok: true })
  target.dispatch("ready", { ok: true })

  expect(count).toBe(1)
})

test("supports fromRecord in an end-to-end flow", () => {
  const target = TypedEventTarget.fromRecord<{
    saved: { id: string; ok: boolean }
  }>()

  let seen: { type: string; id: string; ok: boolean } | undefined

  target.addEventListener("saved", (event) => {
    seen = { type: event.type, id: event.id, ok: event.ok }
  })

  const result = target.dispatch("saved", { id: "42", ok: true })

  expect(result).toBe(true)
  expect(target.hasListeners("saved")).toBe(true)
  expect(seen).toEqual({ type: "saved", id: "42", ok: true })
})

test("removes a listener cleanly", () => {
  const target = TypedEventTarget.from<{
    change: { value: number }
  }>()

  let count = 0
  const listener = () => {
    count += 1
  }

  target.addEventListener("change", listener)
  target.removeEventListener("change", listener)
  target.dispatch("change", { value: 1 })

  expect(count).toBe(0)
})

test("works with happy-dom elements", () => {
  const window = new Window()
  const node = asWithTypedEventTarget<{
    click: { clientX: number; clientY: number }
  }>(window.document.createElement("button"))

  let seen: { type: string; clientX: number; clientY: number } | undefined

  node.addEventListener("click", ({ type, clientX, clientY }) => {
    seen = { type, clientX, clientY }
  })

  // @ts-expect-error - dispatchEvent is not typed to know about mouse event
  node.dispatchEvent(new window.MouseEvent("click", { clientX: 30, clientY: 40 }))

  expect(seen).toEqual({ type: "click", clientX: 30, clientY: 40 })
})

test("exports user-facing constructors and aliases", () => {
  expect(DefaultTypedEventTarget).toBe(TypedEventTarget)

  const target = TypedEventTarget.default<{
    ready: { ok: boolean }
  }>()

  let seen = false
  target.addEventListener("ready", (event) => {
    seen = event.ok
  })

  target.dispatch("ready", { ok: true })

  expect(seen).toBe(true)
})
