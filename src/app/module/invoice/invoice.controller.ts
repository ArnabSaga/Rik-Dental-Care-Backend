import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/helpers/catchAsync";
import { sendResponse } from "../../shared/response/sendResponse";
import { generatePDF } from "../../utils/pdfGenerator";
import { IInvoiceQuery } from "./invoice.interface";
import { InvoiceService } from "./invoice.service";
import { getParamId } from "./invoice.utils";

const getInvoices = catchAsync(async (req: Request, res: Response) => {
  const result = await InvoiceService.getInvoices(req.query as IInvoiceQuery, req.user!);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Invoices fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const createInvoice = catchAsync(async (req: Request, res: Response) => {
  const result = await InvoiceService.createInvoice(req.body, req.user!, req.file);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Invoice created successfully",
    data: result,
  });
});

const getInvoiceById = catchAsync(async (req: Request, res: Response) => {
  const invoiceId = getParamId(req.params.id);

  const result = await InvoiceService.getInvoiceById(invoiceId, req.user!);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Invoice fetched successfully",
    data: result,
  });
});

const updateInvoice = catchAsync(async (req: Request, res: Response) => {
  const invoiceId = getParamId(req.params.id);

  const result = await InvoiceService.updateInvoice(invoiceId, req.body, req.user!, req.file);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Invoice updated successfully",
    data: result,
  });
});

const deleteInvoice = catchAsync(async (req: Request, res: Response) => {
  const invoiceId = getParamId(req.params.id);

  const result = await InvoiceService.deleteInvoice(invoiceId, req.user!);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Invoice deleted successfully",
    data: result,
  });
});

const downloadInvoice = catchAsync(async (req: Request, res: Response) => {
  const invoiceId = getParamId(req.params.id);

  const result = await InvoiceService.getInvoicePdfContent(invoiceId, req.user!);

  generatePDF(result.title, result.content, res);
});

export const InvoiceController = {
  getInvoices,
  createInvoice,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  downloadInvoice,
};
