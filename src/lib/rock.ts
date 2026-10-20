export const rockShots = ['Before the lights', 'Guitar / kick drum', 'The stage locks together',
  'Vocal spotlight', 'Turn it up', 'The final hit'];

// At most three rows; Canvas measures and fits each row inside the safe width.
export function layoutRockLine(text: string): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const count = Math.min(3, Math.max(1, Math.ceil(text.length / 22)));
  const rows: string[] = [];
  let cursor = 0;
  for (let i = 0; i < count && cursor < words.length; i++) {
    const take = Math.ceil((words.length - cursor) / (count - i));
    rows.push(words.slice(cursor, cursor + take).join(' '));
    cursor += take;
  }
  return rows;
}
