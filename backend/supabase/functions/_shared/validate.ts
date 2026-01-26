export function requireFields(obj: any, fields: string[]) {
  for (const f of fields) {
    if (obj[f] === undefined) throw new Error(`Missing field: ${f}`);
  }
}
