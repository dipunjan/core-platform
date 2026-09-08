const ACCENTS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#ca8a04',
  '#0891b2',
  '#4f46e5',
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
