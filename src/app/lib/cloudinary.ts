import type { Request } from "express";
import { v2 as cloudinary, UploadApiOptions } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { envVars } from "../config/env";

cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadBufferToCloudinary = (
  buffer: Buffer,
  options: UploadApiOptions = {},
): Promise<{
  secure_url: string;
  public_id: string;
  bytes: number;
  resource_type: string;
}> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed"));
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          bytes: result.bytes,
          resource_type: result.resource_type,
        });
      },
    );

    stream.end(buffer);
  });
};

export const taskAttachmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req: Request, file: Express.Multer.File) => {
    return {
      folder: `${envVars.CLOUDINARY.TASK_ATTACHMENT_FOLDER}`,
      resource_type: "auto",
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`,
    };
  },
});

export const userProfileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req: Request, _file: Express.Multer.File) => {
    // const userId = req.user!.id;
    return {
      folder: `${envVars.CLOUDINARY.USER_PROFILE_FOLDER}`,
      resource_type: "image",
      public_id: `profile-${Date.now()}`,
    };
  },
});

const getPublicIdFromUrl = (fileUrl: string) => {
  try {
    const url = new URL(fileUrl);
    const uploadMarker = "/upload/";
    const markerIndex = url.pathname.indexOf(uploadMarker);

    if (markerIndex === -1) return null;

    let publicPath = url.pathname.slice(markerIndex + uploadMarker.length);
    publicPath = publicPath.replace(/^v\d+\//, "");
    publicPath = publicPath.replace(/\.[^/.]+$/, "");

    return publicPath || null;
  } catch {
    return null;
  }
};

export const destroyCloudinaryAssetByUrl = async (fileUrl: string) => {
  const publicId = getPublicIdFromUrl(fileUrl);

  if (!publicId) return false;

  const attempts: Array<"image" | "raw"> = ["image", "raw"];

  for (const resourceType of attempts) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: resourceType,
      });

      if (result.result === "ok") {
        return true;
      }

      if (result.result === "not found") {
        continue;
      }
    } catch {
      continue;
    }
  }

  return false;
};

export { cloudinary };
