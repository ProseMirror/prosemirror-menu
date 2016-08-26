const {copyObj} = require("../util/obj")

copyObj(require("./menu"), exports)
exports.MenuBarEditorView = require("./menubar").MenuBarEditorView

// !! This module defines a number of building blocks for ProseMirror
// menus, along with a [menu bar](#menuBar) implementation.

// ;; #path=MenuElement #kind=interface
// The types defined in this module aren't the only thing you can
// display in your menu. Anything that conforms to this interface can
// be put into a menu structure.

// :: (pm: ProseMirror) → ?DOMNode #path=MenuElement.render
// Render the element for display in the menu. Returning `null` can be
// used to signal that this element shouldn't be displayed for the
// given editor state.
