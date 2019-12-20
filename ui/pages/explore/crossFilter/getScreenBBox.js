// COPIED from d3-tip
// Returns an Object {n, s, e, w, nw, sw, ne, se}
function getScreenBBox(targetel) {
  while (targetel.getScreenCTM == null && targetel.parentNode == null) {
    // eslint-disable-next-line no-param-reassign
    targetel = targetel.parentNode;
  }

  function getSVGNode(el) {
    const svgNode = el;
    if (!svgNode) return null;
    if (svgNode.tagName.toLowerCase() === 'svg') return svgNode;
    return svgNode.ownerSVGElement;
  }

  const bbox = {};
  const matrix = targetel.getScreenCTM();
  const tbbox = targetel.getBBox();
  const {
    width, height, x, y,
  } = tbbox;
  const svg = getSVGNode(targetel);
  const point = svg.createSVGPoint();

  point.x = x;
  point.y = y;
  bbox.nw = point.matrixTransform(matrix);
  point.x += width;
  bbox.ne = point.matrixTransform(matrix);
  point.y += height;
  bbox.se = point.matrixTransform(matrix);
  point.x -= width;
  bbox.sw = point.matrixTransform(matrix);
  point.y -= height / 2;
  bbox.w = point.matrixTransform(matrix);
  point.x += width;
  bbox.e = point.matrixTransform(matrix);
  point.x -= width / 2;
  point.y -= height / 2;
  bbox.n = point.matrixTransform(matrix);
  point.y += height;
  bbox.s = point.matrixTransform(matrix);

  return bbox;
}

export default getScreenBBox;
