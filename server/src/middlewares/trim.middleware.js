const trimMiddleware = (req, res, next) => {
    const trimStrings = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].trim();
            } else if (Array.isArray(obj[key])) {
                obj[key] = obj[key].map((item) =>
                    typeof item === 'string' ? item.trim() : item,
                );
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                trimStrings(obj[key]);
            }
        }
    };

    trimStrings(req.body);
    // Express 5 builds req.query again on every read, so the trimmed copy is kept on the request
    const query = req.query;
    trimStrings(query);
    Object.defineProperty(req, 'query', { value: query, writable: true, configurable: true, enumerable: true });
    trimStrings(req.params);

    next();
};

module.exports = trimMiddleware;
