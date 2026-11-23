const puppeteer = require('puppeteer');
const config = require('../configs/app.config');
const logger = require('../utils/logger.util');
const { renderTemplate } = require('../utils/template.util');

// PDFs are HTML (a Handlebars template) printed by headless Chrome (Puppeteer), so they can use normal CSS.
// One browser is started on the first PDF and reused (starting it takes about a second); each PDF gets its own
// page (tab), closed when done. closePdfBrowser() ends it on shutdown.
let browserPromise = null;

const getBrowser = () => {
    if (!browserPromise) {
        browserPromise = puppeteer.launch({ headless: true });
        // A failed start is not cached, so the next PDF tries again
        browserPromise.catch(() => {
            browserPromise = null;
        });
    }
    return browserPromise;
};

// Only the HTML itself is allowed: nothing from the network or the disk, so data printed into a template can
// never make the server fetch an address (images and fonts go in as data: URLs)
const ALLOWED_URL = /^(data:|about:blank)/;

// htmlToPdf('<h1>Hi</h1>', { format: 'A4' }) -> Buffer. Options: Puppeteer's page.pdf() options.
const htmlToPdf = async (html, options = {}) => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        await page.setJavaScriptEnabled(false);
        await page.setRequestInterception(true);
        page.on('request', (request) => (ALLOWED_URL.test(request.url()) ? request.continue() : request.abort()));
        await page.setContent(html, { waitUntil: 'load' });
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '16mm', bottom: '20mm', left: '16mm' },
            ...options,
        });
        return Buffer.from(pdf);
    } finally {
        await page.close();
    }
};

// Renders src/templates/pdfs/<template>.hbs inside layouts/pdf.hbs and prints it; every template gets `appName`.
// renderPdf('sample-report', { title, rows }) -> Buffer. Send it with
// res.type('application/pdf').attachment('report.pdf').send(buffer).
const renderPdf = async (template, data = {}, options = {}) => {
    const html = renderTemplate(`pdfs/${template}`, { appName: config.appName, ...data }, { layout: 'layouts/pdf' });
    return htmlToPdf(html, options);
};

const closePdfBrowser = async () => {
    if (!browserPromise) {
        return false;
    }
    const pending = browserPromise;
    browserPromise = null;
    try {
        await (await pending).close();
    } catch (error) {
        logger.warn({ err: error }, 'Could not close the PDF browser');
    }
    return true;
};

module.exports = {
    htmlToPdf,
    renderPdf,
    closePdfBrowser,
};
