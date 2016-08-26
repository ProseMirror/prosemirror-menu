const {elt, insertCSS} = require("../util/dom")

const {renderGrouped} = require("./menu")

const prefix = "ProseMirror-menubar"

exports.menuBar = function(options) {
  return {
    createView(editorView, state) {
      return new BarView(editorView, state, options)
    },

    updateView(view, _, newState, props) {
      view.update(newState, props)
    },

    destroyView(view) {
      view.destroy()
    }
  }
}

class BarView {
  constructor(editorView, state, options) {
    this.wrapper = elt("div", {class: prefix})
    this.spacer = null

    this.editorView = editorView
    editorView.wrapper.insertBefore(this.wrapper, editorView.wrapper.firstChild)

    this.maxHeight = 0
    this.widthForMaxHeight = 0
    this.floating = false
    this.content = options.content

    this.update(state, editorView.props)

    if (options.float) {
      this.updateFloat()
      this.scrollFunc = () => {
        if (!document.body.contains(this.wrapper))
          window.removeEventListener("scroll", this.scrollFunc)
        else
          this.updateFloat()
      }
      window.addEventListener("scroll", this.scrollFunc)
    }
  }

  destroy() {
    this.wrapper.parentNode.removeChild(this.wrapper)
    if (this.spacer) this.spacer.parentNode.removeChild(this.spacer)
    if (this.scrollFunc) window.removeEventListener("scroll", this.scrollFunc)
  }

  update(state, props) {
    this.wrapper.textContent = ""
    this.wrapper.appendChild(renderGrouped(state, props, this.content))

    if (this.floating) {
      this.updateScrollCursor()
    } else {
      if (this.wrapper.offsetWidth != this.widthForMaxHeight) {
        this.widthForMaxHeight = this.wrapper.offsetWidth
        this.maxHeight = 0
      }
      if (this.wrapper.offsetHeight > this.maxHeight) {
        this.maxHeight = this.wrapper.offsetHeight
        this.wrapper.style.minHeight = this.maxHeight + "px"
      }
    }
  }

  updateScrollCursor() {
    let selection = this.editorView.root.getSelection()
    if (!selection.focusNode) return
    let rects = selection.getRangeAt(0).getClientRects()
    let selRect = rects[selectionIsInverted(selection) ? 0 : rects.length - 1]
    if (!selRect) return
    let menuRect = this.wrapper.getBoundingClientRect()
    if (selRect.top < menuRect.bottom && selRect.bottom > menuRect.top) {
      let scrollable = findWrappingScrollable(this.wrapper)
      if (scrollable) scrollable.scrollTop -= (menuRect.bottom - selRect.top)
    }
  }

  updateFloat() {
    let parent = this.wrapper.parentNode, editorRect = parent.getBoundingClientRect()
    if (this.floating) {
      if (editorRect.top >= 0 || editorRect.bottom < this.wrapper.offsetHeight + 10) {
        this.floating = false
        this.wrapper.style.position = this.wrapper.style.left = this.wrapper.style.width = ""
        this.wrapper.style.display = ""
        this.spacer.parentNode.removeChild(this.spacer)
        this.spacer = null
      } else {
        let border = (parent.offsetWidth - parent.clientWidth) / 2
        this.wrapper.style.left = (editorRect.left + border) + "px"
        this.wrapper.style.display = (editorRect.top > window.innerHeight ? "none" : "")
      }
    } else {
      if (editorRect.top < 0 && editorRect.bottom >= this.wrapper.offsetHeight + 10) {
        this.floating = true
        let menuRect = this.wrapper.getBoundingClientRect()
        this.wrapper.style.left = menuRect.left + "px"
        this.wrapper.style.width = menuRect.width + "px"
        this.wrapper.style.position = "fixed"
        this.spacer = elt("div", {class: prefix + "-spacer", style: "height: " + menuRect.height + "px"})
        parent.insertBefore(this.spacer, this.wrapper)
      }
    }
  }
}

// Not precise, but close enough
function selectionIsInverted(selection) {
  if (selection.anchorNode == selection.focusNode) return selection.anchorOffset > selection.focusOffset
  return selection.anchorNode.compareDocumentPosition(selection.focusNode) == Node.DOCUMENT_POSITION_FOLLOWING
}

function findWrappingScrollable(node) {
  for (let cur = node.parentNode; cur; cur = cur.parentNode)
    if (cur.scrollHeight > cur.clientHeight) return cur
}

insertCSS(`
.${prefix} {
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  position: relative;
  min-height: 1em;
  color: #666;
  padding: 1px 6px;
  top: 0; left: 0; right: 0;
  border-bottom: 1px solid silver;
  background: white;
  z-index: 10;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  overflow: visible;
}
`)
