/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/unist-util-flatmap";
exports.ids = ["vendor-chunks/unist-util-flatmap"];
exports.modules = {

/***/ "(ssr)/./node_modules/unist-util-flatmap/index.js":
/*!**************************************************!*\
  !*** ./node_modules/unist-util-flatmap/index.js ***!
  \**************************************************/
/***/ ((module) => {

eval("module.exports = flatMap\n\nfunction flatMap(ast, fn) {\n  return transform(ast, 0, null)[0]\n\n  function transform(node, index, parent) {\n    if (node.children) {\n      var out = []\n      for (var i = 0, n = node.children.length; i < n; i++) {\n        var xs = transform(node.children[i], i, node)\n        if (xs) {\n          for (var j = 0, m = xs.length; j < m; j++) {\n            out.push(xs[j])\n          }\n        }\n      }\n      node.children = out\n    }\n\n    return fn(node, index, parent)\n  }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvdW5pc3QtdXRpbC1mbGF0bWFwL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELE9BQU87QUFDdkQ7QUFDQTtBQUNBLHlDQUF5QyxPQUFPO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hZG1pbi9Eb2N1bWVudHMvR2l0SHViL2dyYWZpYy1kZXNpZ24vbm9kZV9tb2R1bGVzL3VuaXN0LXV0aWwtZmxhdG1hcC9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IGZsYXRNYXBcblxuZnVuY3Rpb24gZmxhdE1hcChhc3QsIGZuKSB7XG4gIHJldHVybiB0cmFuc2Zvcm0oYXN0LCAwLCBudWxsKVswXVxuXG4gIGZ1bmN0aW9uIHRyYW5zZm9ybShub2RlLCBpbmRleCwgcGFyZW50KSB7XG4gICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgIHZhciBvdXQgPSBbXVxuICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICB2YXIgeHMgPSB0cmFuc2Zvcm0obm9kZS5jaGlsZHJlbltpXSwgaSwgbm9kZSlcbiAgICAgICAgaWYgKHhzKSB7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDAsIG0gPSB4cy5sZW5ndGg7IGogPCBtOyBqKyspIHtcbiAgICAgICAgICAgIG91dC5wdXNoKHhzW2pdKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbm9kZS5jaGlsZHJlbiA9IG91dFxuICAgIH1cblxuICAgIHJldHVybiBmbihub2RlLCBpbmRleCwgcGFyZW50KVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/unist-util-flatmap/index.js\n");

/***/ })

};
;