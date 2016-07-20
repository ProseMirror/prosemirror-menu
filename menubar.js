const {elt, insertCSS} = require("../util/dom")

const {renderGrouped} = require("./menu")

const prefix = "ProseMirror-menubar"

class MenuBar {
  constructor(place, state, props) {
    this.wrapper = elt("div", {class: prefix})
    this.spacer = null

    if (place.appendChild) place.appendChild(this.wrapper)
    else place(this.wrapper)

    this.maxHeight = 0
    this.widthForMaxHeight = 0
    this.floating = false

    this.props = null
    this.update(state, props)
  }

  update(state, props) {
    if (props) this.props = props
    this.wrapper.textContent = ""
    this.wrapper.appendChild(renderGrouped(state, this.props, this.props.content))
  }
}
exports.MenuBar = MenuBar

insertCSS(`
.${prefix} {
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  position: relative;
  min-height: 1em;
  color: #666;
  padding: 1px 6px;
  border-bottom: 1px solid silver;
  background: white;
  z-index: 10;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  overflow: visible;
}
`)
