import createError from 'http-errors';

export const validate = (schema) => (req, _res, next) => {
  const data = { body: req.body, params: req.params, query: req.query };
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return next(createError(400, msg));
  }
  next();
};

