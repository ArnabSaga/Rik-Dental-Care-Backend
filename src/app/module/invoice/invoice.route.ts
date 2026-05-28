import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { validateRole } from "../../middleware/validateRole";
import { fileUpload } from "../../utils/fileUpload";
import { requireAuth } from "../user/user.utils";
import { InvoiceController } from "./invoice.controller";
import { INVOICE_ROLE } from "./invoice.utils";
import { InvoiceValidation } from "./invoice.validation";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validateRequest({ query: InvoiceValidation.getInvoicesQuery }),
  InvoiceController.getInvoices
);

router.post(
  "/",
  validateRole(INVOICE_ROLE.ADMIN),
  fileUpload.uploadTaskAttachment.single("attachmentFile"),
  validateRequest({ body: InvoiceValidation.createInvoice }),
  InvoiceController.createInvoice
);

router.get(
  "/download/:id",
  validateRequest({ params: InvoiceValidation.idParam }),
  InvoiceController.downloadInvoice
);

router.get(
  "/:id",
  validateRequest({ params: InvoiceValidation.idParam }),
  InvoiceController.getInvoiceById
);

router.put(
  "/:id",
  validateRole(INVOICE_ROLE.ADMIN),
  fileUpload.uploadTaskAttachment.single("attachmentFile"),
  validateRequest({
    params: InvoiceValidation.idParam,
    body: InvoiceValidation.updateInvoice,
  }),
  InvoiceController.updateInvoice
);

router.patch(
  "/:id",
  validateRole(INVOICE_ROLE.ADMIN),
  fileUpload.uploadTaskAttachment.single("attachmentFile"),
  validateRequest({
    params: InvoiceValidation.idParam,
    body: InvoiceValidation.updateInvoice,
  }),
  InvoiceController.updateInvoice
);

router.delete(
  "/:id",
  validateRole(INVOICE_ROLE.ADMIN),
  validateRequest({ params: InvoiceValidation.idParam }),
  InvoiceController.deleteInvoice
);

export const InvoiceRoutes = router;
