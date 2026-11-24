export const generateSlug = (name) => {
    if (!name) return 'unknown';

    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/(^-|-$)+/g, '');   // Remove leading or trailing hyphens
};

export default generateSlug;
