import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { s3Client, s3Config } from '@/config/aws';
import { logger } from '@/utils/logger';

export class UploadService {
  static async uploadAvatar(buffer: Buffer, userId: string): Promise<string> {
    try {
      // Process image with Sharp
      const processedImage = await sharp(buffer)
        .resize(200, 200, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      // Upload to S3
      const key = `avatars/${userId}.webp`;
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
}

