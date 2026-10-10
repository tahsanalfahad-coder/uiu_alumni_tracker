// Only accept plain strings from query params. `?batch[$ne]=x` arrives as an object
// in Express and would otherwise be treated as a Mongo operator (NoSQL injection).
export const asString = (value, maxLength = 100) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : undefined;

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
