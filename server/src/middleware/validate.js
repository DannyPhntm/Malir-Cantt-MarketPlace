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
        return res.status(422).json({ error: 'Validation failed', fields });
      }
      next(err);
    }
  };
}
