/**
 * HTML-to-PDF export pipeline (architecture document section 6, step 6).
 * Lazily imports puppeteer so environments without a downloaded Chromium
 * binary can still build/run the rest of the app; this route will throw a
 * clear error until `npx puppeteer browsers install chrome` has been run.
 */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
