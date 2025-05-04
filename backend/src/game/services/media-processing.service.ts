import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { spawn } from 'child_process';
import { MediaAssetEntity } from '../entities/media-asset.entity';
import { ConfigService } from '@nestjs/config';

const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const exists = util.promisify(fs.exists);

export interface ImageResizeOptions {
  width?: number;
  height?: number;
  fit?: keyof sharp.FitEnum;
  withoutEnlargement?: boolean;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
}

export interface VideoProcessingOptions {
  format?: 'mp4' | 'webm';
  quality?: 'low' | 'medium' | 'high';
  generateThumbnail?: boolean;
  thumbnailTime?: number; // seconds from start
  resolution?: '480p' | '720p' | '1080p';
}

@Injectable()
export class MediaProcessingService {
  private readonly logger = new Logger(MediaProcessingService.name);
  private readonly uploadDir: string;
  private readonly processingDir: string;
  private readonly ffmpegBin: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    this.processingDir = path.join(this.uploadDir, 'processed');
    this.ffmpegBin = this.configService.get<string>('FFMPEG_BIN', 'ffmpeg');
    
    // Ensure the processing directory exists
    this.ensureDirectoryExists(this.processingDir);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      if (!(await exists(dirPath))) {
        await mkdir(dirPath, { recursive: true });
      }
    } catch (error) {
      this.logger.error(`Failed to create directory ${dirPath}: ${error.message}`);
      throw error;
    }
  }

  private getDateBasedPath(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return path.join(this.processingDir, `${year}-${month}-${day}`);
  }

  /**
   * Process an image file and create optimized versions
   * @param asset The media asset entity
   * @param options The resize options
   * @returns Object with paths to original and processed versions
   */
  async processImage(
    asset: MediaAssetEntity,
    options: Record<string, ImageResizeOptions> = {},
  ): Promise<Record<string, string>> {
    const inputPath = path.join(this.uploadDir, asset.filePath);
    
    // Validate input file exists
    if (!(await exists(inputPath))) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const dateDir = this.getDateBasedPath();
    await this.ensureDirectoryExists(dateDir);
    
    const parsedPath = path.parse(asset.filePath);
    const fileNameBase = parsedPath.name;
    
    const result: Record<string, string> = {
      original: asset.filePath,
    };

    // Default to creating standard sizes if none provided
    if (Object.keys(options).length === 0) {
      options = {
        thumbnail: { width: 150, height: 150, fit: 'cover', quality: 80, format: 'webp' },
        small: { width: 320, height: 240, fit: 'inside', quality: 85, format: 'webp' },
        medium: { width: 640, height: 480, fit: 'inside', quality: 85, format: 'webp' },
        large: { width: 1280, height: 720, fit: 'inside', quality: 85, format: 'webp' },
        optimized: { quality: 85, format: 'webp' },
      };
    }
    
    try {
      // Process each requested size
      for (const [sizeName, sizeOptions] of Object.entries(options)) {
        const fileFormat = sizeOptions.format || 'webp'; // Default to WebP for best compression
        const outputFileName = `${fileNameBase}_${sizeName}.${fileFormat}`;
        const outputPath = path.join(dateDir, outputFileName);
        const relativeOutputPath = path.relative(this.uploadDir, outputPath);
        
        let processedImage = sharp(inputPath);
        
        // Apply resizing if dimensions provided
        if (sizeOptions.width || sizeOptions.height) {
          processedImage = processedImage.resize({
            width: sizeOptions.width,
            height: sizeOptions.height,
            fit: sizeOptions.fit || 'cover',
            withoutEnlargement: sizeOptions.withoutEnlargement !== false,
          });
        }
        
        // Set output format and quality
        switch (fileFormat) {
          case 'jpeg':
            processedImage = processedImage.jpeg({ quality: sizeOptions.quality || 85 });
            break;
          case 'png':
            processedImage = processedImage.png({ quality: sizeOptions.quality || 85 });
            break;
          case 'webp':
            processedImage = processedImage.webp({ quality: sizeOptions.quality || 85 });
            break;
          case 'avif':
            processedImage = processedImage.avif({ quality: sizeOptions.quality || 70 });
            break;
          default:
            processedImage = processedImage.webp({ quality: sizeOptions.quality || 85 });
        }
        
        // Save the processed image
        await processedImage.toFile(outputPath);
        result[sizeName] = relativeOutputPath;
        
        this.logger.log(`Created ${sizeName} version: ${relativeOutputPath}`);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to process image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a video file and create optimized versions
   * @param asset The media asset entity
   * @param options The video processing options
   * @returns Object with paths to original and processed versions
   */
  async processVideo(
    asset: MediaAssetEntity,
    options: VideoProcessingOptions = {},
  ): Promise<Record<string, string>> {
    const inputPath = path.join(this.uploadDir, asset.filePath);
    
    // Validate input file exists
    if (!(await exists(inputPath))) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const dateDir = this.getDateBasedPath();
    await this.ensureDirectoryExists(dateDir);
    
    const parsedPath = path.parse(asset.filePath);
    const fileNameBase = parsedPath.name;
    
    const result: Record<string, string> = {
      original: asset.filePath,
    };

    // Set default options
    const format = options.format || 'mp4';
    const quality = options.quality || 'medium';
    const resolution = options.resolution || '720p';
    const generateThumbnail = options.generateThumbnail !== false;
    const thumbnailTime = options.thumbnailTime || 0;
    
    // Map quality and resolution to ffmpeg parameters
    const qualityMap = {
      low: { crf: '28', preset: 'faster' },
      medium: { crf: '23', preset: 'medium' },
      high: { crf: '18', preset: 'slow' },
    };
    
    const resolutionMap = {
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
    };
    
    try {
      // Create processed video
      const outputFileName = `${fileNameBase}_${resolution}_${quality}.${format}`;
      const outputPath = path.join(dateDir, outputFileName);
      const relativeOutputPath = path.relative(this.uploadDir, outputPath);
      
      const { width, height } = resolutionMap[resolution];
      const { crf, preset } = qualityMap[quality];
      
      // Build ffmpeg arguments
      const args = [
        '-i', inputPath,
        '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
        '-c:v', format === 'webm' ? 'libvpx-vp9' : 'libx264',
        '-crf', crf,
        '-preset', preset,
        '-c:a', format === 'webm' ? 'libopus' : 'aac',
        '-b:a', '128k',
        outputPath,
      ];
      
      // Run ffmpeg process
      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn(this.ffmpegBin, args);
        
        ffmpeg.stderr.on('data', (data) => {
          // FFmpeg outputs to stderr by default
          this.logger.debug(`FFmpeg: ${data.toString()}`);
        });
        
        ffmpeg.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`FFmpeg process exited with code ${code}`));
            return;
          }
          resolve();
        });
        
        ffmpeg.on('error', (err) => {
          reject(err);
        });
      });
      
      result.processed = relativeOutputPath;
      this.logger.log(`Created processed video: ${relativeOutputPath}`);
      
      // Generate thumbnail if requested
      if (generateThumbnail) {
        const thumbnailFileName = `${fileNameBase}_thumbnail.jpg`;
        const thumbnailPath = path.join(dateDir, thumbnailFileName);
        const relativeThumbnailPath = path.relative(this.uploadDir, thumbnailPath);
        
        const thumbnailArgs = [
          '-i', inputPath,
          '-ss', thumbnailTime.toString(),
          '-vframes', '1',
          '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
          '-q:v', '2',
          thumbnailPath,
        ];
        
        await new Promise<void>((resolve, reject) => {
          const ffmpeg = spawn(this.ffmpegBin, thumbnailArgs);
          
          ffmpeg.on('close', (code) => {
            if (code !== 0) {
              reject(new Error(`FFmpeg thumbnail process exited with code ${code}`));
              return;
            }
            resolve();
          });
          
          ffmpeg.on('error', (err) => {
            reject(err);
          });
        });
        
        result.thumbnail = relativeThumbnailPath;
        this.logger.log(`Created video thumbnail: ${relativeThumbnailPath}`);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to process video: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate optimized images for display at various breakpoints (responsive images)
   * @param asset The media asset entity
   * @returns Object with paths to various sizes for responsive display
   */
  async generateResponsiveImages(
    asset: MediaAssetEntity,
  ): Promise<Record<string, string>> {
    // Common responsive breakpoints
    return this.processImage(asset, {
      xs: { width: 320, quality: 80, format: 'webp' },
      sm: { width: 640, quality: 80, format: 'webp' },
      md: { width: 768, quality: 80, format: 'webp' },
      lg: { width: 1024, quality: 80, format: 'webp' },
      xl: { width: 1280, quality: 80, format: 'webp' },
      '2xl': { width: 1536, quality: 80, format: 'webp' },
    });
  }

  /**
   * Convert audio file to normalized mp3 format
   * @param asset The media asset entity
   * @returns Object with paths to original and processed audio
   */
  async processAudio(
    asset: MediaAssetEntity,
  ): Promise<Record<string, string>> {
    const inputPath = path.join(this.uploadDir, asset.filePath);
    
    // Validate input file exists
    if (!(await exists(inputPath))) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const dateDir = this.getDateBasedPath();
    await this.ensureDirectoryExists(dateDir);
    
    const parsedPath = path.parse(asset.filePath);
    const fileNameBase = parsedPath.name;
    
    const outputFileName = `${fileNameBase}_processed.mp3`;
    const outputPath = path.join(dateDir, outputFileName);
    const relativeOutputPath = path.relative(this.uploadDir, outputPath);
    
    try {
      // Run ffmpeg to normalize audio and convert to mp3
      const args = [
        '-i', inputPath,
        '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
        '-ar', '44100',
        '-ab', '192k',
        '-codec:a', 'libmp3lame',
        '-y',
        outputPath,
      ];
      
      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn(this.ffmpegBin, args);
        
        ffmpeg.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`FFmpeg audio process exited with code ${code}`));
            return;
          }
          resolve();
        });
        
        ffmpeg.on('error', (err) => {
          reject(err);
        });
      });
      
      return {
        original: asset.filePath,
        processed: relativeOutputPath,
      };
    } catch (error) {
      this.logger.error(`Failed to process audio: ${error.message}`);
      throw error;
    }
  }
}