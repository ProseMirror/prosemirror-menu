import crel from "crelt"
import {Plugin, EditorState} from "prosemirror-state"
import {EditorView} from "prosemirror-view"

import {renderGrouped, MenuElement} from "./menu"

const prefix = "ProseMirror-menubar"

function isIOS() {
  if (typeof navigator == "undefined") return false
  let agent = navigator.userAgent
  return !/Edge\/\d/.test(agent) && /AppleWebKit/.test(agent) && /Mobile\/\w+/.test(agent)
}

/// A plugin that will place a menu bar above the editor. Note that
/// this involves wrapping the editor in an additional `<div>`.
export function menuBar(options: {
  /// Provides the content of the menu, as a nested array to be
  /// passed to `renderGrouped`.
  content: readonly (readonly MenuElement[])[]

  /// For accessibility purposes, specify if the menu is displayed
  /// horizontally or vertically. The default is "horizontal".
  orientation?: "horizontal" | "vertical";

  /// Determines whether the menu is placed before or after the editor in the DOM.
  /// The default is "before".
  position?: "before" | "after";

  /// Determines whether the menu floats, i.e. whether it sticks to
  /// the top of the viewport when the editor is partially scrolled
  /// out of view.
  floating?: boolean
}): Plugin {
  return new Plugin({
    view(editorView) { return new MenuBarView(editorView, options) }
  })
}

class MenuBarView {
  wrapper: HTMLElement
  menu: HTMLElement
  focusables: HTMLElement[] = []
  focusIndex = 0
  spacer: HTMLElement | null = null
  maxHeight = 0
  widthForMaxHeight = 0
  floating = false
  contentUpdate: (state: EditorState) => boolean
  scrollHandler: ((event: Event) => void) | null = null
  root: Document | ShadowRoot

  constructor(
    readonly editorView: EditorView,
    readonly options: Parameters<typeof menuBar>[0]
  ) {
    this.root = editorView.root
    this.wrapper = crel("div", {class: prefix + "-wrapper"})
    this.menu = this.wrapper.appendChild(crel("div", {class: prefix, role: "toolbar"}))
    this.menu.className = prefix
    this.menu.ariaControlsElements = [editorView.dom]
    if (options.orientation) this.menu.ariaOrientation = options.orientation

    if (editorView.dom.parentNode)
      editorView.dom.parentNode.replaceChild(this.wrapper, editorView.dom)
    if (options.position === "after") {
      this.wrapper.insertBefore(editorView.dom, this.wrapper.firstChild);
    } else {
      this.wrapper.appendChild(editorView.dom);
    }

    let {dom, update, focusables} = renderGrouped(this.editorView, this.options.content)
    this.contentUpdate = update
    this.focusables = focusables
    this.menu.appendChild(dom)
    this.update()

    if (options.floating && !isIOS()) {
      this.updateFloat()
      let potentialScrollers = getAllWrapping(this.wrapper)
      this.scrollHandler = (e: Event) => {
        let root = this.editorView.root
        if (!((root as Document).body || root).contains(this.wrapper))
          potentialScrollers.forEach(el => el.removeEventListener("scroll", this.scrollHandler!))
        else
          this.updateFloat((e.target as HTMLElement).getBoundingClientRect ? e.target as HTMLElement : undefined)
      }
      potentialScrollers.forEach(el => el.addEventListener('scroll', this.scrollHandler!))
    }


    // set `tabindex` to -1 for all but the first focusable item
    for (let i = 1; i < focusables.length; i++) {
      const focusable = focusables[i];
      focusable.setAttribute("tabindex", "-1");
    }

    // update focusIndex on focus change
    for (let i = 0; i < focusables.length; i++) {
      const focusable = focusables[i];
      focusable.addEventListener("focus", () => {
        if (this.focusIndex === i) return;
        const prevFocusItem = this.focusables[this.focusIndex];
        prevFocusItem.setAttribute("tabindex", "-1");
        focusable.setAttribute("tabindex", "0");
        this.focusIndex = i;
      });
    }

    const orientation = this.options.orientation || "horizontal";
    const nextFocusKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    const prevFocusKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";

    this.menu.addEventListener("keydown", (event) => {
      if (event.key === nextFocusKey) {
        event.preventDefault();
        this.setFocusToNext();
      } else if (event.key === prevFocusKey) {
        event.preventDefault();
        this.setFocusToPrev();
      } else if (event.key === "Home") {
        event.preventDefault();
        this.setFocusToFirst();
      } else if (event.key === "End") {
        event.preventDefault();
        this.setFocusToLast();
      }
    });
  }

  setFocusToNext() {
    if (this.focusables.length <= 1) return;
    const currentFocusItem = this.focusables[this.focusIndex];
    currentFocusItem.setAttribute("tabindex", "-1");
    this.focusIndex = (this.focusIndex + 1) % this.focusables.length;
    const nextFocusItem = this.focusables[this.focusIndex];
    nextFocusItem.setAttribute("tabindex", "0");
    nextFocusItem.focus();
  }

  setFocusToPrev() {
    if (this.focusables.length <= 1) return;
    const currentFocusItem = this.focusables[this.focusIndex];
    currentFocusItem.setAttribute("tabindex", "-1");
    this.focusIndex = (this.focusIndex - 1 + this.focusables.length) % this.focusables.length;
    const prevFocusItem = this.focusables[this.focusIndex];
    prevFocusItem.setAttribute("tabindex", "0");
    prevFocusItem.focus();
  }

  setFocusToFirst() {
    if (this.focusables.length === 0) return;
    const currentFocusItem = this.focusables[this.focusIndex];
    currentFocusItem.setAttribute("tabindex", "-1");
    this.focusIndex = 0;
    const firstFocusItem = this.focusables[0];
    firstFocusItem.setAttribute("tabindex", "0");
    firstFocusItem.focus();
  }

  setFocusToLast() {
    if (this.focusables.length === 0) return;
    const currentFocusItem = this.focusables[this.focusIndex];
    currentFocusItem.setAttribute("tabindex", "-1");
    this.focusIndex = this.focusables.length - 1;
    const lastFocusItem = this.focusables[this.focusIndex];
    lastFocusItem.setAttribute("tabindex", "0");
    lastFocusItem.focus();
  }

  update() {
    if (this.editorView.root != this.root) {
      let {dom, update} = renderGrouped(this.editorView, this.options.content)
      this.contentUpdate = update
      this.menu.replaceChild(dom, this.menu.firstChild!)
      this.root = this.editorView.root
    }
    this.contentUpdate(this.editorView.state)

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
    let selection = (this.editorView.root as Document).getSelection()!
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

  updateFloat(scrollAncestor?: HTMLElement) {
    let parent = this.wrapper, editorRect = parent.getBoundingClientRect(),
        top = scrollAncestor ? Math.max(0, scrollAncestor.getBoundingClientRect().top) : 0

    if (this.floating) {
      if (editorRect.top >= top || editorRect.bottom < this.menu.offsetHeight + 10) {
        this.floating = false
        this.menu.style.position = this.menu.style.left = this.menu.style.top = this.menu.style.width = ""
        this.menu.style.display = ""
        this.spacer!.parentNode!.removeChild(this.spacer!)
        this.spacer = null
      } else {
        let border = (parent.offsetWidth - parent.clientWidth) / 2
        this.menu.style.left = (editorRect.left + border) + "px"
        this.menu.style.display = editorRect.top > (this.editorView.dom.ownerDocument.defaultView || window).innerHeight
          ? "none" : ""
        if (scrollAncestor) this.menu.style.top = top + "px"
      }
    } else {
      if (editorRect.top < top && editorRect.bottom >= this.menu.offsetHeight + 10) {
        this.floating = true
        let menuRect = this.menu.getBoundingClientRect()
        this.menu.style.left = menuRect.left + "px"
        this.menu.style.width = menuRect.width + "px"
        if (scrollAncestor) this.menu.style.top = top + "px"
        this.menu.style.position = "fixed"
        this.spacer = crel("div", {class: prefix + "-spacer", style: `height: ${menuRect.height}px`})
        parent.insertBefore(this.spacer, this.menu)
      }
    }
  }

  destroy() {
    if (this.wrapper.parentNode)
      this.wrapper.parentNode.replaceChild(this.editorView.dom, this.wrapper)
  }
}

// Not precise, but close enough
function selectionIsInverted(selection: Selection) {
  if (selection.anchorNode == selection.focusNode) return selection.anchorOffset > selection.focusOffset
  return selection.anchorNode!.compareDocumentPosition(selection.focusNode!) == Node.DOCUMENT_POSITION_FOLLOWING
}

function findWrappingScrollable(node: Node) {
  for (let cur = node.parentNode; cur; cur = cur.parentNode)
    if ((cur as HTMLElement).scrollHeight > (cur as HTMLElement).clientHeight) return cur as HTMLElement
}

function getAllWrapping(node: Node) {
  let res: (Node | Window)[] = [node.ownerDocument!.defaultView || window]
  for (let cur = node.parentNode; cur; cur = cur.parentNode)
    res.push(cur)
  return res
}
