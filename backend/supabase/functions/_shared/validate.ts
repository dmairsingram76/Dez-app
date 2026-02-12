export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function requireFields(obj: any, fields: string[]) {
  if (!obj || typeof obj !== 'object') {
    throw new ValidationError('Invalid request body');
  }
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null) {
      throw new ValidationError(`Missing field: ${f}`);
    }
  }
}

export function validateString(value: unknown, fieldName: string, options?: {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  if (options?.minLength && value.length < options.minLength) {
    throw new ValidationError(`${fieldName} must be at least ${options.minLength} characters`);
  }
  if (options?.maxLength && value.length > options.maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${options.maxLength} characters`);
  }
  if (options?.pattern && !options.pattern.test(value)) {
    throw new ValidationError(`${fieldName} has invalid format`);
  }
  return value;
}

export function validateNumber(value: unknown, fieldName: string, options?: {
  min?: number;
  max?: number;
  integer?: boolean;
}): number {
  const num = typeof value === 'string' ? Number(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a number`);
  }
  if (options?.integer && !Number.isInteger(num)) {
    throw new ValidationError(`${fieldName} must be an integer`);
  }
  if (options?.min !== undefined && num < options.min) {
    throw new ValidationError(`${fieldName} must be at least ${options.min}`);
  }
  if (options?.max !== undefined && num > options.max) {
    throw new ValidationError(`${fieldName} must be at most ${options.max}`);
  }
  return num;
}

export function validateCoordinates(lat: unknown, lng: unknown): { lat: number; lng: number } {
  const validLat = validateNumber(lat, 'latitude', { min: -90, max: 90 });
  const validLng = validateNumber(lng, 'longitude', { min: -180, max: 180 });
  return { lat: validLat, lng: validLng };
}

export function sanitizeString(value: string): string {
  // Remove potential injection characters and trim
  return value
    .trim()
    .replace(/[<>'"`;]/g, '')
    .slice(0, 10000); // Max length cap
}
