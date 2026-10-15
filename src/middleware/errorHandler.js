export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// express needs all 4 args to treat this as an error handler
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ message });
  }

  // duplicate key (unique index)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    return res.status(409).json({ message: `That ${field} is already taken` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }

  // body-parser errors, e.g. broken JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }

  res.status(err.status || 500).json({
    message: err.status ? err.message : 'Something went wrong on the server',
  });
};
