const crel = require("crel")
const {EditorView} = require("../view")

const {renderGrouped} = require("./menu")

const prefix = "ProseMirror-menubar"

class MenuBarEditorView {
  constructor(place, props) {
    this.wrapper = crel("div", {class: prefix + "-wrapper"})
    if (place.appendChild) place.appendChild(this.wrapper)
    else if (place) place(this.wrapper)
    this.editor = new EditorView(this.wrapper, props)

    this.menu = crel("div", {class: prefix})
    this.menu.className = prefix
    this.spacer = null

    this.wrapper.insertBefore(this.menu, this.wrapper.firstChild)

    this.maxHeight = 0
    this.widthForMaxHeight = 0
    this.floating = false

    this.props = props
    this.updateMenu()

    if (this.editor.someProp("floatingMenu")) {
      this.updateFloat()
      this.scrollFunc = () => {
        if (!this.editor.root.contains(this.wrapper))
          window.removeEventListener("scroll", this.scrollFunc)
        else
          this.updateFloat()
      }
      window.addEventListener("scroll", this.scrollFunc)
    }
  }

  update(props) {
    this.props = props
    this.editor.update(props)
    this.updateMenu()
  }

  updateState(state) {
    this.editor.updateState(state)
    this.updateMenu()
  }

  updateMenu() {
    this.menu.textContent = ""
    this.menu.appendChild(renderGrouped(this.editor, this.editor.someProp("menuContent")))

    if (this.floating) {
      this.updateScrollCursor()
    } else {
      if (this.menu.offsetWidth != this.widthForMaxHeight) {
        this.widthForMaxHeight = this.menu.offsetWidth
        this.maxHeight = 0
      }
      if (this.menu.offsetHeight > this.maxHeight) {
        this.maxHeight = this.menu.offsetHeight
        this.menu.style.minHeight = this.maxHeight + "px"
      }
    }
  }


  updateScrollCursor() {
    let selection = this.editor.root.getSelection()
    if (!selection.focusNode) return
    let rects = selection.getRangeAt(0).getClientRects()
    let selRect = rects[selectionIsInverted(selection) ? 0 : rects.length - 1]
    if (!selRect) return
    let menuRect = this.menu.getBoundingClientRect()
    if (selRect.top < menuRect.bottom && selRect.bottom > menuRect.top) {
      let scrollable = findWrappingScrollable(this.wrapper)
      if (scrollable) scrollable.scrollTop -= (menuRect.bottom - selRect.top)
    }
  }

  updateFloat() {
    let parent = this.wrapper, editorRect = parent.getBoundingClientRect()
    if (this.floating) {
      if (editorRect.top >= 0 || editorRect.bottom < this.menu.offsetHeight + 10) {
        this.floating = false
        this.menu.style.position = this.menu.style.left = this.menu.style.width = ""
        this.menu.style.display = ""
        this.spacer.parentNode.removeChild(this.spacer)
        this.spacer = null
      } else {
        let border = (parent.offsetWidth - parent.clientWidth) / 2
        this.menu.style.left = (editorRect.left + border) + "px"
        this.menu.style.display = (editorRect.top > window.innerHeight ? "none" : "")
      }
    } else {
      if (editorRect.top < 0 && editorRect.bottom >= this.menu.offsetHeight + 10) {
        this.floating = true
        let menuRect = this.menu.getBoundingClientRect()
        this.menu.style.left = menuRect.left + "px"
        this.menu.style.width = menuRect.width + "px"
        this.menu.style.position = "fixed"
        this.spacer = crel("div", {class: prefix + "-spacer", style: `height: ${menuRect.height}px`})
        parent.insertBefore(this.spacer, this.menu)
      }
    }
  }
}
exports.MenuBarEditorView = MenuBarEditorView

// Not precise, but close enough
function selectionIsInverted(selection) {
  if (selection.anchorNode == selection.focusNode) return selection.anchorOffset > selection.focusOffset
  return selection.anchorNode.compareDocumentPosition(selection.focusNode) == Node.DOCUMENT_POSITION_FOLLOWING
}

function findWrappingScrollable(node) {
  for (let cur = node.parentNode; cur; cur = cur.parentNode)
    if (cur.scrollHeight > cur.clientHeight) return cur
}
