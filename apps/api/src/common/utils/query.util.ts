export function parseSort(sort: string | undefined): Record<string, 'asc' | 'desc'> | undefined {
  if (!sort) return undefined;
  const trimmed = sort.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('-')) return { [trimmed.slice(1)]: 'desc' };
  if (trimmed.startsWith('+')) return { [trimmed.slice(1)]: 'asc' };
  return { [trimmed]: 'asc' };
}

export function parseWhere(whereRaw: string | undefined): Record<string, unknown> {
  if (!whereRaw) return {};
  let parsed: unknown;
  try { parsed = JSON.parse(whereRaw); } catch { return {}; }
  if (!parsed || typeof parsed !== 'object') return {};

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      if (key === 'OR' || key === 'AND' || key === 'NOT') result[key] = value;
      else result[key] = { in: value };
    }
    else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/.test(value)) {
      const coerced = new Date(value);
      result[key] = isNaN(coerced.getTime()) ? value : coerced;
    } else result[key] = value;
  }
  return result;
}

export function withActiveWhere(
  where: Record<string, unknown> | undefined,
  includeInactive = false,
): Record<string, unknown> | undefined {
  if (includeInactive) return where;
  const safeWhere = where ?? {};
  if ('is_active' in safeWhere) return safeWhere;
  return { ...safeWhere, is_active: true };
}
