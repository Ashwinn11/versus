/**
 * The colour a contender fights under. Offered as a fixed palette rather than
 * a free picker: two sides have to stay distinguishable at a glance, and hand-
 * picked hexes reliably produce muddy or near-identical pairs.
 *
 * All are high-chroma and roughly equal in lightness so neither side looks
 * stronger by accident.
 */
export const PALETTE = [
  { name: "Volt", value: "#a855f7" },
  { name: "Inferno", value: "#f43f5e" },
  { name: "Ember", value: "#fb923c" },
  { name: "Solar", value: "#facc15" },
  { name: "Venom", value: "#84cc16" },
  { name: "Mint", value: "#2dd4bf" },
  { name: "Tide", value: "#38bdf8" },
  { name: "Cobalt", value: "#6366f1" },
  { name: "Bubblegum", value: "#f472b6" },
  { name: "Stone", value: "#8d8378" },
] as const;

export const DEFAULT_COLOR_A = PALETTE[0].value;
export const DEFAULT_COLOR_B = PALETTE[1].value;

/**
 * Picks the second colour so it never lands next to the first on the wheel.
 * Offsetting by roughly half the palette keeps an auto-assigned pair readable.
 */
export function complementaryColor(color: string): string {
  const i = PALETTE.findIndex((p) => p.value === color);
  if (i === -1) return DEFAULT_COLOR_B;
  return PALETTE[(i + PALETTE.length / 2) % PALETTE.length].value;
}
