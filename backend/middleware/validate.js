import { BadRequestError } from '../errors/ApiError.js';

function formatIssues(issues) {
  return issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new BadRequestError(
        'VALIDATION_ERROR',
        'Validation failed',
        formatIssues(result.error.issues)
      ));
    }
    req.body = result.data; // mass assignment zaštita
    next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(new BadRequestError(
        'INVALID_PARAM',
        'Invalid URL parameter',
        formatIssues(result.error.issues)
      ));
    }
    req.validatedParams = result.data; // Express 5: req.params read-only
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new BadRequestError(
        'INVALID_QUERY',
        'Invalid query parameters',
        formatIssues(result.error.issues)
      ));
    }
    req.validatedQuery = result.data; // Express 5: req.query read-only
    next();
  };
}