;({MenuItem: exports.MenuItem, Dropdown: exports.Dropdown, DropdownSubmenu: exports.DropdownSubmenu,
   renderGrouped: exports.renderGrouped, icons: exports.icons, joinUpItem: exports.joinUpItem,
   liftItem: exports.liftItem, selectParentNodeItem: exports.selectParentNodeItem,
   undoItem: exports.undoItem, redoItem: exports.redoItem, wrapItem: exports.wrapItem,
   blockTypeItem: exports.blockTypeItem} = require("./menu"))
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
