/** Parse JSON while rejecting repeated decoded member names in each object. */
export function parseUniqueJson(source) {
  const value = JSON.parse(source);
  const objects = [];
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '{') objects.push(new Set());
    else if (char === '[') objects.push(null);
    else if (char === '}' || char === ']') objects.pop();
    else if (char === '"') {
      const start = i++;
      while (i < source.length && source[i] !== '"') {
        if (source[i] === '\\') i++;
        i++;
      }
      let next = i + 1;
      while (/\s/.test(source[next] ?? '')) next++;
      if (source[next] === ':') {
        const name = JSON.parse(source.slice(start, i + 1));
        const members = objects.at(-1);
        if (members.has(name)) throw new Error(`Duplicate JSON member name '${name}'`);
        members.add(name);
      }
    }
  }
  return value;
}
