const fs = require('node:fs');
const path = require('node:path');
const Handlebars = require('handlebars');
const config = require('../configs/app.config');

// Templates for emails and PDFs live in src/templates as Handlebars files (.hbs):
//   layouts/   the outer page (email.hbs, pdf.hbs); a layout prints the rendered template with {{{body}}}
//   partials/  pieces shared by templates, used as {{> button url=... label=...}} (named after the file)
//   emails/    one template per email: <name>.hbs (HTML) and <name>.text.hbs (plain text)
//   pdfs/      one template per PDF
// {{value}} is HTML-escaped, so data from users is safe to print; {{{value}}} is not escaped and is only for
// HTML we produce ourselves (the layout's body). Plain-text templates (.text.hbs) are never escaped.
const TEMPLATES_DIR = path.join(__dirname, '../templates');

// The logo in every email and PDF ({{> logo}}, from layouts/). One file, replaced per project: a PNG (mail apps
// do not show SVG), about 4x the 40px it is shown at. Emails attach it (src="cid:logo"); PDFs embed it as a
// data: URL, because the PDF renderer loads no files.
const LOGO_PATH = path.join(__dirname, '../../static/images/logo.png');
const LOGO_CID = 'logo';
let logoDataUri = null;

const getLogoDataUri = () => {
    if (!logoDataUri || !useCache()) {
        logoDataUri = `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`;
    }
    return logoDataUri;
};

const handlebars = Handlebars.create();
const cache = new Map();
let partialsRegistered = false;

// Compiled templates are kept in memory; in development they are read again each time, so edits show at once
const useCache = () => config.env !== 'development';

const templatePath = (name) => {
    const file = path.resolve(TEMPLATES_DIR, `${name}.hbs`);
    // Names come from our code, but a name with "../" must never read a file outside the templates folder
    if (!file.startsWith(TEMPLATES_DIR + path.sep)) {
        throw new Error(`Invalid template name: ${name}`);
    }
    return file;
};

const registerPartials = () => {
    if (partialsRegistered && useCache()) {
        return;
    }
    const dir = path.join(TEMPLATES_DIR, 'partials');
    for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.hbs'))) {
        handlebars.registerPartial(path.basename(file, '.hbs'), fs.readFileSync(path.join(dir, file), 'utf8'));
    }
    partialsRegistered = true;
};

const compile = (name) => {
    if (useCache() && cache.has(name)) {
        return cache.get(name);
    }
    // Plain-text templates (<name>.text.hbs) are not HTML, so nothing in them is escaped
    const template = handlebars.compile(fs.readFileSync(templatePath(name), 'utf8'), { noEscape: name.endsWith('.text') });
    cache.set(name, template);
    return template;
};

const templateExists = (name) => fs.existsSync(templatePath(name));

// renderTemplate('emails/reset-password', { name }, { layout: 'layouts/email' }) -> HTML string.
// A missing template throws (ENOENT), so a typo in a name fails loudly.
const renderTemplate = (name, data = {}, { layout } = {}) => {
    registerPartials();
    const body = compile(name)(data);
    return layout ? compile(layout)({ ...data, body }) : body;
};

module.exports = {
    renderTemplate,
    templateExists,
    getLogoDataUri,
    TEMPLATES_DIR,
    LOGO_PATH,
    LOGO_CID,
};
