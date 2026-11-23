const mongoose = require('mongoose');

// '-createdAt' -> { createdAt: -1, _id: -1 }. _id is added as a tie-breaker, so documents with the same value
// keep a stable order and never appear on two pages (or on none).
const toSort = (sort) => {
    const descending = sort.startsWith('-');
    const field = descending ? sort.slice(1) : sort;
    const direction = descending ? -1 : 1;

    return field === '_id' ? { _id: direction } : { [field]: direction, _id: direction };
};

// A case-insensitive "contains" filter for free-text search over the given fields. The text is escaped, so
// characters like . * ( are matched literally and cannot form a slow or unexpected regular expression.
// The $or / $regex operators are built here, not taken from the request, so they are marked trusted for sanitizeFilter.
const searchFilter = (text, fields) => {
    if (!text) {
        return {};
    }
    const pattern = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return { $or: fields.map((field) => ({ [field]: mongoose.trusted({ $regex: pattern, $options: 'i' }) })) };
};

// One page of a collection and the totals for the pagination contract (../CLAUDE.md). Repositories call this;
// reads are lean (plain objects, no Mongoose documents) and the count runs in parallel with the page.
// Returns { items, pagination: { page, limit, totalItems, totalPages } }.
const paginate = async (Model, { filter = {}, projection = null, page = 1, limit = 20, sort = '-_id' } = {}) => {
    const [items, totalItems] = await Promise.all([
        Model.find(filter, projection).sort(toSort(sort)).skip((page - 1) * limit).limit(limit).lean(),
        Model.countDocuments(filter),
    ]);

    return {
        items,
        pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    };
};

module.exports = {
    paginate,
    searchFilter,
    toSort,
};
