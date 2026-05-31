import PDFDocument from "pdfkit";
import { Response } from "express";
import { logger } from "./logger";

/**
 * Generate a PDF document from content and pipe it to the response
 * @param title - PDF title
 * @param content - Text content to include in the PDF
 * @param res - Express Response object
 */
export const generatePDF = (
  title: string,
  content: string,
  res: Response,
): void => {
  try {
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${title.replace(/\s+/g, "_")}.pdf`,
    );

    // Pipe the PDF into the response
    doc.pipe(res);

    // Add Header
    doc.fontSize(25).text("Rik Dental Care", { align: "center" }).moveDown();

    doc.fontSize(18).text(title, { underline: true }).moveDown();

    // Add Content
    doc.fontSize(12).text(content, {
      align: "justify",
      lineGap: 5,
    });

    // Add Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(10)
        .text(
          `Generated on: ${new Date().toLocaleString()} - Page ${i + 1}`,
          50,
          doc.page.height - 50,
          { align: "center" },
        );
    }

    // Finalize the PDF
    doc.end();
  } catch (error) {
    logger.error("Error generating PDF:", error);
    res.status(500).json({
      success: false,
      message: "Could not generate PDF",
    });
  }
};
