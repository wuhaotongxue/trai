 
/**
 * electron_multimodal.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Multimodal processing service for Electron desktop client with native OS integration
 */

import { ipcService } from "./electron_ipc";

interface MultimodalProcessingOptions {
  type: "image" | "audio" | "video" | "pdf";
  file: File;
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

interface MultimodalResult {
  success: boolean;
  data?: unknown;
  error?: string;
  processingTime?: number;
}

class ElectronMultimodalService {
  async processFile(options: MultimodalProcessingOptions): Promise<MultimodalResult> {
    const startTime = Date.now();

    try {
      let result: MultimodalResult;

      switch (options.type) {
        case "image":
          result = await this.processImage(options);
          break;
        case "audio":
          result = await this.processAudio(options);
          break;
        case "video":
          result = await this.processVideo(options);
          break;
        case "pdf":
          result = await this.processPDF(options);
          break;
        default:
          return { success: false, error: `Unsupported file type: ${options.type}` };
      }

      if (result.success) {
        result.processingTime = Date.now() - startTime;
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Processing failed";
      console.error("[ElectronMultimodal] Processing error:", error);
      return { success: false, error: errorMessage };
    }
  }

  private async processImage(options: MultimodalProcessingOptions): Promise<MultimodalResult> {
    options.onProgress?.(10);

    try {
      const arrayBuffer = await options.file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      options.onProgress?.(30);

      let imageDataUrl: string | null = null;

      if (window.electronAPI?.clipboard) {
        imageDataUrl = await window.electronAPI.clipboard.readImage();
      } else {
        imageDataUrl = await this.fileToDataURL(options.file);
      }

      options.onProgress?.(60);

      const analysisResult = await ipcService.invoke<{ description: string; objects: string[]; text?: string }>(
        { domain: "multimodal", action: "analyzeImage" },
        { image: imageDataUrl, filename: options.file.name }
      );

      options.onProgress?.(100);

      if (analysisResult.success && analysisResult.data) {
        return {
          success: true,
          data: {
            ...analysisResult.data,
            thumbnail: imageDataUrl,
            originalName: options.file.name,
            size: options.file.size,
          },
        };
      }

      return { success: false, error: analysisResult.error || "Image analysis failed" };
    } catch (error) {
      throw error;
    }
  }

  private async processAudio(options: MultimodalProcessingOptions): Promise<MultimodalResult> {
    options.onProgress?.(10);

    try {
      const audioBuffer = await options.file.arrayBuffer();

      options.onProgress?.(30);

      const transcriptionResult = await ipcService.invoke<{
        text: string;
        language: string;
        confidence: number;
      }>({ domain: "multimodal", action: "transcribeAudio" }, {
        audio: Array.from(new Uint8Array(audioBuffer)),
        filename: options.file.name,
        format: options.file.type.split("/")[1],
      });

      options.onProgress?.(100);

      if (transcriptionResult.success && transcriptionResult.data) {
        return {
          success: true,
          data: {
            ...transcriptionResult.data,
            originalName: options.file.name,
            duration: this.estimateAudioDuration(options.file.size),
          },
        };
      }

      return { success: false, error: transcriptionResult.error || "Audio transcription failed" };
    } catch (error) {
      throw error;
    }
  }

  private async processVideo(options: MultimodalProcessingOptions): Promise<MultimodalResult> {
    options.onProgress?.(10);

    try {
      const videoBuffer = await options.file.arrayBuffer();

      options.onProgress?.(30);

      const thumbnailDataUrl = await this.extractVideoThumbnail(videoBuffer);

      options.onProgress?.(60);

      const metadata = await ipcService.invoke<{
        duration: number;
        resolution: { width: number; height: number };
        codec: string;
      }>({ domain: "multimodal", action: "getVideoMetadata" }, {
        video: Array.from(new Uint8Array(videoBuffer)),
        filename: options.file.name,
      });

      options.onProgress?.(100);

      return {
        success: true,
        data: {
          ...(metadata.success ? metadata.data : {}),
          thumbnail: thumbnailDataUrl,
          originalName: options.file.name,
          size: options.file.size,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  private async processPDF(options: MultimodalProcessingOptions): Promise<MultimodalResult> {
    options.onProgress?.(10);

    try {
      const pdfBuffer = await options.file.arrayBuffer();

      options.onProgress?.(30);

      const parseResult = await ipcService.invoke<{
        text: string;
        pages: number;
        tables?: unknown[][];
        images?: { page: number; description: string }[];
      }>({ domain: "multimodal", action: "parsePDF" }, {
        pdf: Array.from(new Uint8Array(pdfBuffer)),
        filename: options.file.name,
        extractTables: true,
        extractImages: true,
      });

      options.onProgress?.(100);

      if (parseResult.success && parseResult.data) {
        return {
          success: true,
          data: {
            ...parseResult.data,
            originalName: options.file.name,
            size: options.file.size,
          },
        };
      }

      return { success: false, error: parseResult.error || "PDF parsing failed" };
    } catch (error) {
      throw error;
    }
  }

  private fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  private estimateAudioDuration(fileSizeInBytes: number): number {
    const estimatedBitrate = 128000;
    return Math.round((fileSizeInBytes * 8) / estimatedBitrate);
  }

  private async extractVideoThumbnail(videoBuffer: ArrayBuffer): Promise<string | null> {
    try {
      if (!window.electronAPI?.platform || !window.electronAPI?.fs) {
        return null;
      }

      const tempPath = await window.electronAPI.platform.getAppPath("temp");
      const thumbnailPath = `${tempPath}/thumbnail_${Date.now()}.png`;

      await ipcService.invoke({ domain: "multimodal", action: "extractThumbnail" }, {
        video: Array.from(new Uint8Array(videoBuffer)),
        outputPath: thumbnailPath,
        timestamp: 1,
      });

      const thumbnailBase64 = await window.electronAPI.fs.readFile(thumbnailPath);
      return `data:image/png;base64,${thumbnailBase64}`;
    } catch (error) {
      console.warn("[ElectronMultimodal] Failed to extract video thumbnail:", error);
      return null;
    }
  }
}

export const electronMultimodalService = new ElectronMultimodalService();
export default electronMultimodalService;
