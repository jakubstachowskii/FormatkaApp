export function fmt(n) {
  return (Math.round(n * 10) / 10).toString().replace('.', ',');
}

export function makePartsMap() {
  const partsMap = {};
  function addPart(name, wCm, hCm, thickMm, qty) {
    const key = name + '|' + wCm.toFixed(1) + '|' + hCm.toFixed(1) + '|' + thickMm;
    if (!partsMap[key]) partsMap[key] = { name, w: wCm, h: hCm, thickMm, qty: 0 };
    partsMap[key].qty += qty;
  }
  return { addPart, get: () => Object.values(partsMap) };
}
