import multer from "multer";
import { FILE_UPLOAD } from "../shared/constants/upload.constant";
import { taskAttachmentStorage, userProfileStorage } from "../lib/cloudinary";

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, PDF, and DOCX are allowed."));
  }
};

export const uploadTaskAttachment = multer({
  storage: taskAttachmentStorage,
  limits: {
    fileSize: FILE_UPLOAD.MAX_FILE_SIZE,
  },
  fileFilter,
});

export const uploadProfileImage = multer({
  storage: userProfileStorage,
  limits: {
    fileSize: FILE_UPLOAD.MAX_FILE_SIZE,
  },
  fileFilter,
});

export const fileUpload = {
  uploadTaskAttachment,
  uploadProfileImage,
};
