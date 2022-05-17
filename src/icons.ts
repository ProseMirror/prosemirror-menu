const SVG = "http://www.w3.org/2000/svg"
const XLINK = "http://www.w3.org/1999/xlink"

const prefix = "ProseMirror-icon"

function hashPath(path: string) {
  let hash = 0
  for (let i = 0; i < path.length; i++)
    hash = (((hash << 5) - hash) + path.charCodeAt(i)) | 0
  return hash
}

export function getIcon(
  icon: {path: string, width: number, height: number} | {text: string, css?: string} | {dom: Node}
): HTMLElement {
  let node = document.createElement("div")
  node.className = prefix
  if ((icon as any).path) {
    let {path, width, height} = icon as {path: string, width: number, height: number}
    let name = "pm-icon-" + hashPath(path).toString(16)
    if (!document.getElementById(name)) buildSVG(name, icon as {path: string, width: number, height: number})
    let svg = node.appendChild(document.createElementNS(SVG, "svg"))
    svg.style.width = (width / height) + "em"
    let use = svg.appendChild(document.createElementNS(SVG, "use"))
    use.setAttributeNS(XLINK, "href", /([^#]*)/.exec(document.location.toString())![1] + "#" + name)
  } else if ((icon as any).dom) {
    node.appendChild((icon as any).dom.cloneNode(true))
  } else {
    let {text, css} = icon as {text: string, css?: string}
    node.appendChild(document.createElement("span")).textContent = text || ''
    if (css) (node.firstChild as HTMLElement).style.cssText = css
  }
  return node
}

function buildSVG(name: string, data: {width: number, height: number, path: string}) {
  let collection = document.getElementById(prefix + "-collection") as Element
  if (!collection) {
    collection = document.createElementNS(SVG, "svg")
    collection.id = prefix + "-collection"
    ;(collection as HTMLElement).style.display = "none"
    document.body.insertBefore(collection, document.body.firstChild)
  }
  let sym = document.createElementNS(SVG, "symbol")
  sym.id = name
  sym.setAttribute("viewBox", "0 0 " + data.width + " " + data.height)
  let path = sym.appendChild(document.createElementNS(SVG, "path"))
  path.setAttribute("d", data.path)
  collection.appendChild(sym)
}
