import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { s3Client, s3Config } from '@/config/aws';
import { logger } from '@/utils/logger';

export class UploadService {
  /**
   * Delete file from S3 using the full URL
   */
  private static async deleteFileByUrl(fileUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const key = fileUrl.replace(`${s3Config.baseUrl}/`, '');
      
      const command = new DeleteObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
      });

      await s3Client.send(command);
      logger.info(`File deleted: ${key}`);
    } catch (error) {
      logger.error('Failed to delete file:', error);
      // Don't throw error if delete fails (file might not exist)
    }
  }

  static async uploadAvatar(buffer: Buffer, userId: string, oldAvatarUrl?: string): Promise<string> {
    try {
      // Delete old avatar if exists
      if (oldAvatarUrl) {
        await this.deleteFileByUrl(oldAvatarUrl);
      }

      // Process image with Sharp
      const processedImage = await sharp(buffer)
        .resize(200, 200, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      // Upload to S3 with timestamp to avoid caching issues
      const timestamp = Date.now();
      const key = `avatars/${userId}-${timestamp}.webp`;
      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: processedImage,
        ContentType: 'image/webp',
        ACL: 'public-read',
      });

      await s3Client.send(command);

      const avatarUrl = `${s3Config.baseUrl}/${key}`;
      logger.info(`Avatar uploaded for user ${userId}: ${avatarUrl}`);

      return avatarUrl;
    } catch (error) {
      logger.error('Failed to upload avatar:', error);
      throw new Error('Falha ao fazer upload do avatar');
    }
  }

  static async uploadCoverImage(buffer: Buffer, userId: string, oldCoverUrl?: string): Promise<string> {
    try {
      // Delete old cover image if exists
      if (oldCoverUrl) {
        await this.deleteFileByUrl(oldCoverUrl);
      }

      // Process image with Sharp - wider format for cover
      const processedImage = await sharp(buffer)
        .resize(1200, 400, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();

      // Upload to S3 with timestamp
      const timestamp = Date.now();
      const key = `covers/${userId}-${timestamp}.webp`;
      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: processedImage,
        ContentType: 'image/webp',
        ACL: 'public-read',
      });

      await s3Client.send(command);

      const coverUrl = `${s3Config.baseUrl}/${key}`;
      logger.info(`Cover image uploaded for user ${userId}: ${coverUrl}`);

      return coverUrl;
    } catch (error) {
      logger.error('Failed to upload cover image:', error);
      throw new Error('Falha ao fazer upload da imagem de capa');
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
      logger.error('Failed to delete avatar:', error);
      // Don't throw error if delete fails (avatar might not exist)
    }
  }

  static async deleteCoverImage(coverUrl: string): Promise<void> {
    try {
      await this.deleteFileByUrl(coverUrl);
    } catch (error) {
      logger.error('Failed to delete cover image:', error);
      // Don't throw error if delete fails
    }
  }
}

