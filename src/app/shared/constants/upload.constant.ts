export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_IMAGE_MIME_TYPES: ["image/jpeg", "image/jpg", "image/png"],
  ALLOWED_DOCUMENT_MIME_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;
