import { TypedEventTarget } from "./src/index.ts"

const target = TypedEventTarget.fromRecord<{
  click: { x: number; y: number }
}>()

const target2 = new TypedEventTarget<{
  click: { x: 0; y: 1 },
  keydown: { key: string }
}>()

target2.addEventListener("keydown", (event) => {
  console.log(`Pressed ${event.detail.key}`)
})

target.addEventListener("click", (event) => {
  console.log(`Clicked at (${event.detail.x}, ${event.detail.y})`)
})


target.dispatch("click", { x: 10, y: 20 })
target2.dispatch("keydown", { key: "Enter" })
