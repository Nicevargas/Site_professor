const TITLE_PREFIXES = ['prof', 'prof.', 'profa', 'profa.', 'professor', 'professora', 'dr', 'dr.', 'dra', 'dra.', 'sr', 'sr.', 'sra', 'sra.'];

/** Primeiro nome sem títulos: "Prof. Roberto Almeida" -> "Roberto". */
export function getFirstName(fullName: string): string {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  const withoutTitles = parts.filter((p) => !TITLE_PREFIXES.includes(p.toLowerCase()));
  return withoutTitles[0] || parts[0] || '';
}

/** Saudação conforme a hora local. */
export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
