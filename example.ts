
import { TypedEventTarget, asTypedEventTarget } from "./src/index.ts"
import { Document } from "happy-dom"

const target = TypedEventTarget.fromRecord<{
  click: { x: number; y: number }
}>()

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


function dom() {
  const document = new Document()
  const node = document.createElement("div")
  const target = asTypedEventTarget<{
    click:  {
      detail: {
        x: number;
        y: number
      }
    }
  }>(node)

  target.addEventListener("click", (event) => {
    console.log(`Clicked at (${event.detail.x}, ${event.detail.y})`)
  })

  node.click()
  // target.dispatch("click", { detail: { x: 10, y: 20 } })
}

dom()
