function getRGB(color) {
  return color.split(/[()]/)[1].split(', ').map((x) => Number(x));
}

function getCombinedColor(colors) {
  let [r, g, b] = [255, 255, 255];
  for (let i = 0; i < colors.length; i += 1) {
    const [r2, g2, b2] = getRGB(colors[i]);
    r = r2 + (r - r2) * 0.3;
    g = g2 + (g - g2) * 0.3;
    b = b2 + (b - b2) * 0.3;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

export default getCombinedColor;
