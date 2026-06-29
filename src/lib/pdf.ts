import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface ParsedPdf {
  text: string;
  pageCount: number;
}

export async function parsePdf(file: File): Promise<ParsedPdf> {
  const data = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      text += `${item.str.trim()}${"hasEOL" in item && item.hasEOL ? "\n" : " "}`;
    }
    text = text
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    pages.push(text);
  }

  return {
    text: pages.join("\n\n"),
    pageCount: document.numPages,
  };
}
