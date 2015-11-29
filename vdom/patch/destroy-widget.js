var isWidget = require("virtual-dom/vnode/is-widget")

module.exports = function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}
