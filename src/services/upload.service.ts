import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { s3Client, s3Config } from "@/config/aws";
import { logger } from "@/utils/logger";

export class UploadService {
  /**
   * Delete file from S3 using the full URL
   */
  private static async deleteFileByUrl(fileUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const key = fileUrl.replace(`${s3Config.baseUrl}/`, "");

      const command = new DeleteObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      });

      await s3Client.send(command);
      logger.info(`File deleted: ${key}`);
    } catch (error) {
      logger.error("Failed to delete file:", error);
      // Don't throw error if delete fails (file might not exist)
    }
  }

  static async uploadAvatar(
    buffer: Buffer,
    userId: string,
    oldAvatarUrl?: string
  ): Promise<string> {
    try {
      // Delete old avatar if exists
      if (oldAvatarUrl) {
        await this.deleteFileByUrl(oldAvatarUrl);
      }

      // Process image with Sharp
      const processedImage = await sharp(buffer)
        .resize(200, 200, { fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();

      // Upload to S3 with timestamp to avoid caching issues
      const timestamp = Date.now();
      const key = `avatars/${userId}-${timestamp}.webp`;
      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: processedImage,
        ContentType: "image/webp",
        ACL: "public-read",
      });

      await s3Client.send(command);

      const avatarUrl = `${s3Config.baseUrl}/${key}`;
      logger.info(`Avatar uploaded for user ${userId}: ${avatarUrl}`);

      return avatarUrl;
    } catch (error) {
      logger.error("Failed to upload avatar:", error);
      throw new Error("Falha ao fazer upload do avatar");
    }
  }

  static async uploadCoverImage(
    buffer: Buffer,
    userId: string,
    oldCoverUrl?: string
  ): Promise<string> {
    try {
      // Delete old cover image if exists
      if (oldCoverUrl) {
        await this.deleteFileByUrl(oldCoverUrl);
      }

      // Process image with Sharp - wider format for cover
      const processedImage = await sharp(buffer)
        .resize(1200, 400, { fit: "cover" })
        .webp({ quality: 85 })
        .toBuffer();

      // Upload to S3 with timestamp
      const timestamp = Date.now();
      const key = `covers/${userId}-${timestamp}.webp`;
      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: processedImage,
        ContentType: "image/webp",
        ACL: "public-read",
      });

      await s3Client.send(command);

      const coverUrl = `${s3Config.baseUrl}/${key}`;
      logger.info(`Cover image uploaded for user ${userId}: ${coverUrl}`);

      return coverUrl;
    } catch (error) {
      logger.error("Failed to upload cover image:", error);
      throw new Error("Falha ao fazer upload da imagem de capa");
    }
  }

  static async deleteAvatar(userId: string): Promise<void> {
    try {
      const key = `avatars/${userId}.webp`;
      const command = new DeleteObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      });

      await s3Client.send(command);
      logger.info(`Avatar deleted for user ${userId}`);
    } catch (error) {
      logger.error("Failed to delete avatar:", error);
      // Don't throw error if delete fails (avatar might not exist)
    }
  }

  static async deleteCoverImage(coverUrl: string): Promise<void> {
    try {
      await this.deleteFileByUrl(coverUrl);
    } catch (error) {
      logger.error("Failed to delete cover image:", error);
      // Don't throw error if delete fails
    }
  }

  /**
   * Upload content image (for posts/comments)
   * Allows screenshots and images only
   */
  static async uploadContentImage(
    buffer: Buffer,
    userId: string,
    filename: string,
    mimetype: string
  ): Promise<string> {
    try {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(mimetype)) {
        throw new Error(
          "Tipo de arquivo não permitido. Apenas imagens são aceitas."
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (buffer.length > maxSize) {
        throw new Error("Arquivo muito grande. Tamanho máximo: 5MB");
      }

      // Get image metadata
      const metadata = await sharp(buffer).metadata();

      // Process image - maintain aspect ratio, max width 1200px
      let processedImage = sharp(buffer);

      if (metadata.width && metadata.width > 1200) {
        processedImage = processedImage.resize(1200, null, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Convert to WebP for better compression (except GIFs)
      if (mimetype === "image/gif") {
        // Keep GIFs as is (animations)
        processedImage = processedImage.gif();
      } else {
        processedImage = processedImage.webp({ quality: 85 });
      }

      const finalBuffer = await processedImage.toBuffer();

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const extension = mimetype === "image/gif" ? "gif" : "webp";
      const key = `content/${userId}/${timestamp}-${randomString}.${extension}`;

      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: finalBuffer,
        ContentType: mimetype === "image/gif" ? "image/gif" : "image/webp",
        ACL: "public-read",
      });

      await s3Client.send(command);

      const imageUrl = `${s3Config.baseUrl}/${key}`;
      logger.info(`Content image uploaded by user ${userId}: ${imageUrl}`);

      return imageUrl;
    } catch (error) {
      logger.error("Failed to upload content image:", error);
      throw error instanceof Error
        ? error
        : new Error("Falha ao fazer upload da imagem");
    }
  }

  /**
   * Delete content image
   */
  static async deleteContentImage(imageUrl: string): Promise<void> {
    try {
      await this.deleteFileByUrl(imageUrl);
    } catch (error) {
      logger.error("Failed to delete content image:", error);
    }
  }

  /**
   * Upload notification sound to S3
   */
  static async uploadNotificationSound(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<{ fileUrl: string; fileName: string }> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = originalName.split('.').pop() || 'mp3';
      const fileName = `sound-${timestamp}.${extension}`;
      const key = `sounds/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000',
      });

      await s3Client.send(command);
      const fileUrl = `${s3Config.baseUrl}/${key}`;

      logger.info(`Sound uploaded: ${fileName}`);
      return { fileUrl, fileName };
    } catch (error) {
      logger.error("Failed to upload sound:", error);
      throw new Error("Falha ao fazer upload do som");
    }
  }

  /**
   * Delete notification sound from S3
   */
  static async deleteNotificationSound(fileUrl: string): Promise<void> {
    try {
      await this.deleteFileByUrl(fileUrl);
      logger.info(`Sound deleted from S3`);
    } catch (error) {
      logger.error("Failed to delete sound:", error);
      // Don't throw - file might not exist
    }
  }
}
