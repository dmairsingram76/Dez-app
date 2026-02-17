import { getCorsHeaders, corsHeaders } from './cors.ts';

// Safe error messages that can be shown to clients
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later.',
  'Unauthorized': 'Unauthorized',
  'Missing location': 'Missing location',
  'Invalid event payload': 'Invalid event payload',
  'Method not allowed': 'Method not allowed',
};

// Sanitize error messages to prevent information leakage
function sanitizeErrorMessage(message: string): string {
  // Return safe message if it's a known error
  if (SAFE_ERROR_MESSAGES[message]) {
    return SAFE_ERROR_MESSAGES[message];
  }
  
  // Check for common sensitive patterns and replace with generic message
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /key/i,
    /token/i,
    /credential/i,
    /database/i,
    /sql/i,
    /postgres/i,
    /supabase/i,
    /stack/i,
    /at\s+\w+\s*\(/i,  // Stack traces
    /error\s*:/i,
  ];
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      console.error('Sanitized error:', message); // Log for debugging
      return 'An error occurred. Please try again.';
    }
  }
  
  // For field validation errors, allow them through
  if (message.startsWith('Missing field:')) {
    return message;
  }
  
  // Default: return generic message for unknown errors
  console.error('Unknown error:', message); // Log for debugging
  return 'An error occurred. Please try again.';
}

export function ok(data: unknown, req?: Request) {
  const headers = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify({ data }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
    status: 200,
  });
}

export function error(message: string, status = 400, req?: Request) {
  const headers = req ? getCorsHeaders(req) : corsHeaders;
  const safeMessage = sanitizeErrorMessage(message);
  return new Response(JSON.stringify({ error: safeMessage }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
    status,
  });
}

// Handle OPTIONS preflight requests
export function handlePreflight(req: Request) {
  return new Response(null, {
    headers: getCorsHeaders(req),
    status: 204,
  });
}
