/**
 * XSS Protection Utilities
 * Sanitizes user input to prevent cross-site scripting attacks
 */

// HTML entities that need to be escaped
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML special characters to prevent XSS
 *
 * @param str - String to escape
 * @returns Escaped string safe for HTML insertion
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';

  return String(str).replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize string for safe display
 * Removes potentially dangerous characters and patterns
 *
 * @param input - Input string to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeString(
  input: string | null | undefined,
  maxLength: number = 1000
): string {
  if (!input) return '';

  // Convert to string and limit length
  let sanitized = String(input).slice(0, maxLength);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Escape HTML
  sanitized = escapeHtml(sanitized);

  return sanitized;
}

/**
 * Sanitize SQL identifier (table name, column name, etc.)
 * Only allows alphanumeric characters and underscores
 *
 * @param identifier - SQL identifier to sanitize
 * @returns Sanitized identifier or empty string if invalid
 */
export function sanitizeSqlIdentifier(identifier: string | null | undefined): string {
  if (!identifier) return '';

  // Only allow alphanumeric and underscores, must start with letter/underscore
  const sanitized = String(identifier).replace(/[^a-zA-Z0-9_]/g, '');

  // Must start with letter or underscore
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    return '';
  }

  return sanitized.slice(0, 128); // Limit length
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if dangerous
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';

  const urlStr = String(url).trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (urlStr.startsWith(protocol)) {
      return '';
    }
  }

  // Only allow http, https, mailto, or relative URLs
  if (!/^(https?:\/\/|mailto:|\/|\.\/|#)/.test(urlStr)) {
    return '';
  }

  return String(url).slice(0, 2048); // Limit length
}

/**
 * Type guard to check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Safely parse JSON with type guard
 *
 * @param jsonString - JSON string to parse
 * @returns Parsed object or null if invalid
 */
export function safeJsonParse<T = unknown>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * Sanitize object by escaping all string values
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (isString(value)) {
      sanitized[key as keyof T] = escapeHtml(value) as T[keyof T];
    } else if (isObject(value)) {
      sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T];
    } else if (isArray(value)) {
      sanitized[key as keyof T] = value.map((item) =>
        isString(item) ? escapeHtml(item) : item
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize column name from schema
 *
 * @param columnName - Column name to validate
 * @returns Sanitized column name or throws error
 */
export function validateColumnName(columnName: unknown): string {
  if (!isString(columnName)) {
    throw new Error('Column name must be a string');
  }

  const sanitized = sanitizeSqlIdentifier(columnName);

  if (!sanitized) {
    throw new Error(`Invalid column name: ${columnName}`);
  }

  return sanitized;
}

/**
 * Validate data type
 *
 * @param dataType - Data type to validate
 * @returns Sanitized data type or throws error
 */
export function validateDataType(dataType: unknown): string {
  if (!isString(dataType)) {
    throw new Error('Data type must be a string');
  }

  const allowedTypes = new Set([
    'VARCHAR', 'TEXT', 'STRING', 'INTEGER', 'INT', 'BIGINT',
    'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'DATE', 'TIMESTAMP',
    'BOOLEAN', 'JSONB', 'UUID', 'BYTEA'
  ]);

  const upperType = dataType.toUpperCase();

  if (!allowedTypes.has(upperType)) {
    throw new Error(`Invalid data type: ${dataType}`);
  }

  return upperType;
}
