import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(`[Page ${i}]\n${pageText}`)
  }

  return pages.join('\n\n')
}
