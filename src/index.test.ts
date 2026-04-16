import { expect, test } from "bun:test"
import { TEventTarget, TypedEventTarget } from "./index"

test("flattens object payload onto the event", () => {
  const target = TypedEventTarget.fromRecord<{
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
  const target = TypedEventTarget.fromRecord<{
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
  const target = TypedEventTarget.fromRecord<{
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

test("removes a listener cleanly", () => {
  const target = TypedEventTarget.fromRecord<{
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

test("legacy TEventTarget wrapper still dispatches", () => {
  const target = new TEventTarget<"saved", { id: string }>()

  let seen = ""
  target.addEventListener("saved", (event) => {
    seen = event.id
  })

  target.dispatch("saved", { id: "42" })

  expect(seen).toBe("42")
})
