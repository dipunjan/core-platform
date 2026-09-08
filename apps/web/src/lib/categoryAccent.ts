const ACCENTS = [
  '#047857',
  '#0f766e',
  '#0e7490',
  '#6d28d9',
  '#be185d',
  '#c2410c',
  '#a16207',
  '#4338ca',
];

export function categoryAccent(slug: string) {
  let index = 0;
  for (let i = 0; i < slug.length; i++) {
    index = (index + slug.charCodeAt(i)) % ACCENTS.length;
  }
  return ACCENTS[index];
}

export function categoryInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}
