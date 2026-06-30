import { ZodError } from 'zod';

// Validates a request part ('body' | 'query' | 'params') against a zod schema
// and replaces it with the parsed (typed/coerced) value. On failure responds 422
// with a flat field->message map.
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fields = {};
        for (const issue of err.issues) {
          const key = issue.path.join('.') || '_';
          if (!fields[key]) fields[key] = issue.message;
        }
        // Surface a specific, human-readable message (the first failing field's)
        // as the top-level error so clients that only render `error` still get
        // something useful instead of a bare "Validation failed". `fields` keeps
        // the full per-field map for inline form errors.
        const firstKey = Object.keys(fields)[0];
        const message = (firstKey && fields[firstKey]) || 'Validation failed';
        if (process.env.NODE_ENV !== 'production') {
          // Dev-only: field PATHS that failed (no values) to speed up diagnosis.
          console.debug('[validate] failed:', Object.keys(fields).join(', '));
        }
        return res.status(422).json({ error: message, fields });
      }
      next(err);
    }
  };
}
