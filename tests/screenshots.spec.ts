import { expect, test } from "@playwright/test";
import { Buffer } from "node:buffer";
import { mkdir } from "node:fs/promises";

const screenshotDir = "docs/images";

test.beforeEach(async ({ page }) => {
  await page.goto("/demo/");
  await expect(page.locator("ts-text-marker-viewer").locator(".txt-page")).toBeVisible();
});

test("captures the documented demo states", async ({ page }) => {
  await mkdir(screenshotDir, { recursive: true });

  const viewer = page.locator("ts-text-marker-viewer");

  await expect(viewer.locator("text=TS TextMarker Viewer")).toBeVisible();
  await page.screenshot({
    path: `${screenshotDir}/viewer-demo-document.png`,
    fullPage: true
  });

  await viewer.locator("select.mode").selectOption("search");
  await viewer.locator("input.search").fill("bellum");
  await expect(viewer.locator(".txt-mark-search")).toHaveCount(4);
  await page.screenshot({
    path: `${screenshotDir}/viewer-demo-search.png`,
    fullPage: true
  });

  await viewer.locator("select.mode").selectOption("annotations");
  await expect(viewer.locator(".label-filter")).toHaveCount(4);
  await expect(viewer.locator(".txt-mark-annotation")).toHaveCount(9);
  await page.screenshot({
    path: `${screenshotDir}/viewer-demo-annotations.png`,
    fullPage: true
  });

  await viewer.locator('[data-label-id="conflict"]').click();
  await expect(viewer.locator('[data-label-id="conflict"]')).toHaveClass(/is-hidden/);
  await expect(viewer.locator(".txt-mark-annotation")).toHaveCount(7);
  await viewer.locator('[data-label-id="conflict"]').click();
  await expect(viewer.locator(".txt-mark-annotation")).toHaveCount(9);

  await viewer.locator("select.annotation-style").selectOption("bracket");
  await expect(viewer.locator(".txt-mark-annotation-bracket")).toHaveCount(9);
  await page.screenshot({
    path: `${screenshotDir}/viewer-demo-annotations-bracket.png`,
    fullPage: true
  });
});

test("loads TXT and PDF files through the public file input", async ({ page }) => {
  const viewer = page.locator("ts-text-marker-viewer");
  const fileInput = viewer.locator("input.file-input");

  await fileInput.setInputFiles({
    name: "sample.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("bellum ex file")
  });
  await expect(viewer.locator(".txt-page")).toContainText("bellum ex file");

  await fileInput.setInputFiles({
    name: "sample.pdf",
    mimeType: "application/pdf",
    buffer: createTinyPdf("bellum PDF")
  });
  await expect(viewer.locator(".pdf-page")).toBeVisible();
});

function createTinyPdf(text: string): Buffer {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 160] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  const stream = `BT /F1 24 Tf 40 90 Td (${escapePdfText(text)}) Tj ET`;
  objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);

  let body = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((content, index) => {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += `${index + 1} 0 obj\n${content}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body, "utf8");
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    body += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  body += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body, "utf8");
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
