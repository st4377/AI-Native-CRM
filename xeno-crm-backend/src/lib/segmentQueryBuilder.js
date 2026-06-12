export const ALLOWED_FIELDS = ['total_spend', 'order_count', 'days_since_last_order'];
export const ALLOWED_OPS = ['>', '<', '>=', '<=', '=', '!='];

export function buildWhereClause(rules, startIndex = 1) {
  if (!rules || !Array.isArray(rules.conditions) || rules.conditions.length === 0) {
    return { clause: 'TRUE', params: [] };
  }

  const params = [];
  const parts = rules.conditions.map((cond, i) => {
    if (!ALLOWED_FIELDS.includes(cond.field)) {
      throw new Error(`Invalid field: ${cond.field}`);
    }
    if (!ALLOWED_OPS.includes(cond.op)) {
      throw new Error(`Invalid operator: ${cond.op}`);
    }
    params.push(cond.value);

    const nullGuard = cond.field === 'days_since_last_order'
      ? `${cond.field} IS NOT NULL AND `
      : '';

    return `(${nullGuard}${cond.field} ${cond.op} $${startIndex + i})`;
  });

  const joiner = rules.operator === 'OR' ? ' OR ' : ' AND ';
  return { clause: parts.join(joiner), params };
}