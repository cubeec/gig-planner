// 20 visually distinct colors for gig markers and cards
export const GIG_COLORS = [
  '#E63946', // red
  '#457B9D', // steel blue
  '#2D9E44', // green
  '#F4A261', // sandy orange
  '#9B5DE5', // purple
  '#00B4D8', // sky blue
  '#E76F51', // burnt orange
  '#06D6A0', // mint
  '#FFB703', // amber
  '#D62828', // dark red
  '#7209B7', // violet
  '#3A86FF', // bright blue
  '#F72585', // hot pink
  '#4CC9F0', // light blue
  '#80B918', // lime green
  '#FB8500', // orange
  '#8338EC', // medium purple
  '#06A77D', // teal
  '#DC2F02', // vermillion
  '#023E8A', // navy
];

/**
 * Given a 0-based index, return the color for that gig.
 * Cycles through the palette if there are more gigs than colors.
 */
export function getColorForIndex(index: number): string {
  return GIG_COLORS[index % GIG_COLORS.length];
}
