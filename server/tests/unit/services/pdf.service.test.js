const http = require('node:http');
const { htmlToPdf, renderPdf, closePdfBrowser } = require('../../../src/services/pdf.service');

// A real headless Chrome (Puppeteer): slower than other unit tests, but a mocked browser would prove nothing
jest.setTimeout(60000);

const isPdf = (buffer) => Buffer.isBuffer(buffer) && buffer.subarray(0, 5).toString() === '%PDF-';

afterAll(() => closePdfBrowser());

describe('pdf.service', () => {
    test('renderPdf prints a template (in the PDF layout) to a PDF', async () => {
        const pdf = await renderPdf('sample-report', {
            title: 'Users',
            date: '24 Nov 2026',
            rows: [{ name: 'Ada', email: 'ada@example.com' }],
        });

        expect(isPdf(pdf)).toBe(true);
        expect(pdf.length).toBeGreaterThan(1000);
        // The logo from the layout's header, embedded (the renderer loads no files)
        expect(pdf.toString('latin1')).toMatch(/\/Subtype\s*\/Image/);
    });

    test('htmlToPdf takes Puppeteer options, e.g. landscape', async () => {
        const portrait = await htmlToPdf('<p>Hi</p>');
        const landscape = await htmlToPdf('<p>Hi</p>', { landscape: true });

        expect(isPdf(landscape)).toBe(true);
        // htmlToPdf prints only the given HTML: no layout, so no logo image
        expect(portrait.toString('latin1')).not.toMatch(/\/Subtype\s*\/Image/);
        // The page size is in the file: A4 is 595 x 842 points
        expect(portrait.toString('latin1')).toMatch(/MediaBox \[0 0 595\.\d+ 841\.\d+\]/);
        expect(landscape.toString('latin1')).toMatch(/MediaBox \[0 0 841\.\d+ 595\.\d+\]/);
    });

    test('nothing is loaded from the network, so a template can never make the server fetch an address', async () => {
        const hits = [];
        const server = http.createServer((req, res) => {
            hits.push(req.url);
            res.end('x');
        });
        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
        const base = `http://127.0.0.1:${server.address().port}`;

        try {
            const pdf = await htmlToPdf(`<img src="${base}/image.png"><link rel="stylesheet" href="${base}/style.css">`);
            expect(isPdf(pdf)).toBe(true);
        } finally {
            server.close();
        }

        expect(hits).toEqual([]);
    });

    test('closePdfBrowser closes the browser once; the next PDF starts a new one', async () => {
        expect(await closePdfBrowser()).toBe(true);
        expect(await closePdfBrowser()).toBe(false);

        expect(isPdf(await htmlToPdf('<p>Again</p>'))).toBe(true);
    });
});
