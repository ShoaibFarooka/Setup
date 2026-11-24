const { pickLanguage, translate } = require('../utils/i18n.util');

// The language of this request, from Accept-Language (the client sends the one the user chose):
//   req.language: 'en' | 'ar'; req.t(key, values): a text in it (src/locales/*.json)
// The response says which language it is in (Content-Language), and that it depends on Accept-Language (Vary).
// First in the chain (after the request logger), so every answer, even an early error, can be translated.
const languageMiddleware = (req, res, next) => {
    req.language = pickLanguage(req.get('accept-language'));
    req.t = (key, values) => translate(req.language, key, values);
    res.set('Content-Language', req.language);
    res.vary('Accept-Language');
    next();
};

module.exports = languageMiddleware;
