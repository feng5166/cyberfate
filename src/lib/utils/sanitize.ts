const INJECTION_PATTERNS = [
  /忽略以上/g,
  /ignore\s+(previous|prior|above|all)\s+(instructions?|prompts?|context)/gi,
  /system\s*:/gi,
  /assistant\s*:/gi,
  /system\s+prompt/gi,
  /you\s+are\s+now/gi,
  /act\s+as\s+(if\s+you\s+are\b|a\b)/gi,
  /jailbreak/gi,
  /disregard\s+(all\s+)?(previous|prior|your)\s+(instructions?|training)/gi,
  /forget\s+(all\s+)?(previous|prior|your)\s+(instructions?|training)/gi,
  /override\s+(your\s+)?(instructions?|programming|training)/gi,
];

export function sanitizeUserInput(input: string, maxLen = 500): string {
  let s = input
    // Remove control characters except tab (\t), newline (\n), carriage return (\r)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Remove zero-width and invisible Unicode characters
    .replace(/[\u200B-\u200F\u2028\u2029\u2060-\u2064\u00AD\uFEFF]/g, '')
    // Remove RTL/LTR override characters
    .replace(/[\u202A-\u202E]/g, '');

  for (const pattern of INJECTION_PATTERNS) {
    s = s.replace(pattern, '');
  }

  return s.slice(0, maxLen);
}
