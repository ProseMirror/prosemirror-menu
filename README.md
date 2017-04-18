# prosemirror-menu

[ [**WEBSITE**](http://prosemirror.net) | [**ISSUES**](https://github.com/prosemirror/prosemirror-menu/issues) | [**FORUM**](https://discuss.prosemirror.net) | [**GITTER**](https://gitter.im/ProseMirror/prosemirror) ]

ProseMirror is a well-behaved rich semantic content editor based on
contentEditable, with support for collaborative editing and custom
document schemas.

This module defines an abstraction for building a menu for the
ProseMirror editor, along with an implementation of a menubar.

**Note** that this module exists mostly as an example of how you
_might_ want to approach adding a menu to ProseMirror, but is not
maintained as actively as the core modules related to actual editing.
If you want to extend or improve it, the recommended way is to fork
it. If you are interested in maintaining a serious menu component for
ProseMirror, publish your fork, and if it works for me, I'll gladly
deprecate this in favor of your module.

This code is released under an
[MIT license](https://github.com/prosemirror/prosemirror/tree/master/LICENSE).
There's a [forum](http://discuss.prosemirror.net) for general
discussion and support requests, and the
[Github bug tracker](https://github.com/prosemirror/prosemirror-menu/issues)
is the place to report issues.

## Documentation

When using this module, you should make sure its `style/menu.css` file
is loaded into your page.

### menuBar

`menuBar(options) → Plugin`

A function that returns a plugin that causes an
[`EditorView`](http://prosemirror.net/ref.html#view.EditorView) to
show a menubar above the content.

Supports the following options:

 - **`floating`**`: ?bool`\
   Determines whether the menu floats, i.e. whether it sticks to the
   top of the viewport when the editor is partially scrolled out of
   view.

 - **`content`**`: \[\[MenuElement]]`\
   Provides the content of the menu, as a nested array to be passed to
   `renderGrouped`.

### interface MenuElement

The types defined in this module aren't the only thing you can display
in your menu. Anything that conforms to this interface can be put into a
menu structure.

* `render(pm: ProseMirror) → ?dom.Node`\
  Render the element for display in the menu. Returning `null` can be
  used to signal that this element shouldn't be displayed for the given
  editor state.

### class MenuItem

An icon or label that, when clicked, executes a command.

* `new MenuItem(spec: MenuItemSpec)`

* `spec: MenuItemSpec`\
  The spec used to create the menu item.

* `render(view: EditorView) → dom.Node`\
  Renders the icon according to its display spec, and adds an event
  handler which executes the command when the representation is
  clicked.

### interface MenuItemSpec

The configuration object passed to the `MenuItem` constructor.

* `run(EditorState, fn(Action), EditorView, dom.Event)`\
  The function to execute when the menu item is activated.

* `select(EditorState) → bool`\
  Optional function that is used to determine whether the item is
  appropriate at the moment.

* `onDeselected: ?string`\
  Determines what happens when `select`
  returns false. The default is to hide the item, you can set this to
  `"disable"` to instead render the item with a disabled style.

* `active(EditorState) → bool`\
  A predicate function to determine whether the item is 'active' (for
  example, the item for toggling the strong mark might be active then
  the cursor is in strong text).

* `render(EditorView) → dom.Node`\
  A function that renders the item. You must provide either this,
  [`icon`](#menu.MenuItemSpec.icon), or `label`.

* `icon: ?Object`\
  Describes an icon to show for this item. The object may specify an SVG
  icon, in which case its `path` property should be an [SVG path
  spec](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d),
  and `width` and `height` should provide the viewbox in which that path
  exists. Alternatively, it may have a `text` property specifying a
  string of text that makes up the icon, with an optional `css` property
  giving additional CSS styling for the text. *Or* it may contain `dom`
  property containing a DOM node.

* `label: ?string`\
  Makes the item show up as a text label. Mostly useful for items
  wrapped in a drop-down or similar menu. The object
  should have a `label` property providing the text to display.

* `title: ?string | fn(state) → string)`\
  Defines DOM title (mouseover) text for the item.

* `class: string`\
  Optionally adds a CSS class to the item's DOM representation.

* `css: string`\
  Optionally adds a string of inline CSS to the item's DOM
  representation.

* `execEvent: string`\
  Defines which event on the command's DOM representation should trigger
  the execution of the command. Defaults to mousedown.

### class Dropdown

A drop-down menu, displayed as a label with a downwards-pointing
triangle to the right of it.

* `new Dropdown(content: [MenuElement], options: ?Object)`\
  Create a dropdown wrapping the elements. Options may include the
  following properties:
  
  * **`label`**`: string`\
    The label to show on the drop-down control.
  * **`title`**`: string`\
    Sets the
    [`title`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/title)
    attribute given to the menu control.
  * **`class`**`: string`\
    When given, adds an extra CSS class to the menu control.
  * **`css`**`: string`\
    When given, adds an extra set of CSS styles to the menu control.

* `render(view: EditorView) → dom.Node`\
  Returns a node showing the collapsed menu, which expands when clicked.

### class DropdownSubmenu

Represents a submenu wrapping a group of elements that start hidden and
expand to the right when hovered over or tapped.

* `new DropdownSubmenu(content: [MenuElement], options: ?Object)`\
  Creates a submenu for the given group of menu elements. The following
  options are recognized:
  
  * **`label`**`: string`\
    The label to show on the submenu.

* `render(view: EditorView) → dom.Node`\
  Renders the submenu.

This module exports the following pre-built items or item constructors:

`joinUpItem: MenuItem`

Menu item for the `joinUp` command.

`liftItem: MenuItem`

Menu item for the `lift` command.

`selectParentNodeItem: MenuItem`

Menu item for the `selectParentNode` command.

`undoItem(Object) → MenuItem`

Menu item for the `undo` command.

`redoItem(Object) → MenuItem`

Menu item for the `redo` command.

`wrapItem(nodeType: NodeType, options: Object) → MenuItem`

Build a menu item for wrapping the selection in a given node type. Adds
`run` and `select` properties to the ones present in `options`.
`options.attrs` may be an object or a function, as in `toggleMarkItem`.

`blockTypeItem(nodeType: NodeType, options: Object) → MenuItem`

Build a menu item for changing the type of the textblock around the
selection to the given type. Provides `run`, `active`, and `select`
properties. Others must be given in `options`. `options.attrs` may be an
object to provide the attributes for the textblock node.

To construct your own items, these icons may be useful:

`icons: Object`

A set of basic editor-related icons. Contains the properties `join`,
`lift`, `selectParentNode`, `undo`, `redo`, `strong`, `em`, `code`,
`link`, `bulletList`, `orderedList`, and `blockquote`, each holding an
object that can be used as the `icon` option to `MenuItem`.

`renderGrouped(view: EditorView, content: [union]) → ?dom.DocumentFragment`

Render the given, possibly nested, array of menu elements into a
document fragment, placing separators between them (and ensuring no
superfluous separators appear when some of the groups turn out to be
empty).
