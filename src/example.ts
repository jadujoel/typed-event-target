
import { TypedEventTarget, asTypedEventTarget, asWithTypedEventTarget } from "./index.ts"
import { Window } from "happy-dom"

const target = TypedEventTarget.from<{
  click: { x: number; y: number },
  clock: { time: Date },
}>()

target.addAnyEventListener(({ type, ...extra }) => {
  console.log(`Received event of type ${type}`, extra)
})

target.emit({
  type: "click",
  x: 10,
  y: 20,
})

target.emit("clock", { time: new Date() })

const target2 = new TypedEventTarget<{
  click: { x: 0; y: 1 },
  keydown: { key: string }
}>()

target2.addEventListener("keydown", (event) => {
  console.log(`Pressed ${event.key}`)
})

target.addEventListener("click", (event) => {
  console.log(`Clicked at (${event.x}, ${event.y})`)
})

target.dispatch("click", { x: 10, y: 20 })
target2.dispatch("keydown", { key: "Enter" })

const window = new Window()
const button = window.document.createElement("button")
const node = asTypedEventTarget<{
  click: { clientX: number; clientY: number },
  clack: {
    detail: {
      x: number
      y: number
    }
  }
}>(button)

node.addEventListener("click", (event) => {
  console.log(`Click at (${event.clientX}, ${event.clientY})`)
})

node.addEventListener("clack", (event) => {
  console.log(`Clack at (${event.detail.x}, ${event.detail.y})`)
})

button.dispatchEvent(new window.MouseEvent("click", { clientX: 30, clientY: 40 }))
button.dispatchEvent(new window.CustomEvent("clack", { detail: { x: 50, y: 60 } }))
