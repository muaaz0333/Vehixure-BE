import cloudinary from "cloudinary";
import { Readable } from "stream";
import Response from "../Traits/ApiResponser.js";
export const imageUpload = async (request, reply) => {
  const file = await request.file();
  if (!file) {
    throw new Error("No file provided");
  }
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "public/uploads/",
        allowed_formats: ["png", "jpg", "jpeg", "gif", "bmp", "webp", "tiff", "svg"],
        public_id: Date.now().toString(),
        resource_type: "image"
      },
      (error, data) => {
        if (error) reject(error);
        else resolve(data?.secure_url);
      }
    );
    Readable.from(file.file).pipe(uploadStream);
  });
  return Response.successResponse(reply, {
    success: true,
    message: "Current user retrieved successfully",
    data: {
      imageUrl: result
    }
  });
};
