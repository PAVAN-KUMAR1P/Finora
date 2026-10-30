// Validated categorical palette (dataviz skill reference instance), fixed order —
// never reassigned by rank elsewhere, never cycled past slot 8.
const SLOTS = [
  '#2a78d6', // 1 blue
  '#eb6834', // 2 orange
  '#1baf7a', // 3 aqua
  '#eda100', // 4 yellow
  '#e87ba4', // 5 magenta
  '#008300', // 6 green
  '#6250d6', // 7 violet
  '#e34948', // 8 red
]
const MORE_COLOR = '#b4b2a8' // neutral — overflow bucket, not a hue

/**
 * Assigns a stable color to each category name for ONE rendering context
 * (e.g. a month's donut chart + its legend + table tags), ranked by spend
 * so the most prominent categories get the clearest hues. Categories beyond
 * the 8 validated slots fold into a neutral "More" bucket rather than
 * inventing a 9th hue.
 *
 * @param {string[]} namesRankedByAmount - category names, highest spend first
 * @returns {Map<string, {color: string, more: boolean}>}
 */
export function assignCategoryColors(namesRankedByAmount) {
  const map = new Map()
  namesRankedByAmount.forEach((name, i) => {
    map.set(name, i < SLOTS.length ? { color: SLOTS[i], more: false } : { color: MORE_COLOR, more: true })
  })
  return map
}

export const MORE_LABEL = 'More'

// Label color for text/icons placed on a SOLID categorical fill (not a tint).
// White everywhere except slot 4 (yellow, #eda100), which fails white-on-fill
// contrast — the documented exception in the palette reference.
export function textOnFill(hex) {
  return hex === '#eda100' ? '#0b0b0b' : '#ffffff'
}
