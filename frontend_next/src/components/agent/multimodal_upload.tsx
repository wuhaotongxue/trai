 
/**
 * 文件名: components/agent/multimodal_upload.tsx
 * 作者: wuhao
 * 日期: 2026-05-04 21:00:00
 * 描述: 多模态文件上传组件, 支持图片/音频/PDF拖拽和预览
 */

"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  Mic,
  FileText,
  Upload,
  X,
  Loader2,
  AlertCircle,
  Video,
} from "lucide-react";

/**
 * Supported file types for multi-modal processing
 */
export type MultimodalFileType = "image" | "audio" | "pdf" | "video";

/**
 * Uploaded file info interface
 */
export interface UploadedFileInfo {
  /** Unique ID */
  id: string;
  /** Original file object */
  file: File;
  /** Preview URL (base64 or object URL) */
  previewUrl: string;
  /** File type category */
  fileType: MultimodalFileType;
  /** Display file size */
  displaySize: string;
}

/**
 * Component props interface
 */
interface MultimodalUploadProps {
  /** Accepted file types */
  acceptedTypes?: MultimodalFileType[];
  /** Maximum file size in MB (default: 50) */
  maxSizeMB?: number;
  /** Maximum number of files (default: 5) */
  maxFiles?: number;
  /** Callback when files are selected/changed */
  onFilesChange?: (files: UploadedFileInfo[]) => void;
  /** Currently uploaded files (controlled mode) */
  value?: UploadedFileInfo[];
  /** Whether to show preview area */
  showPreview?: boolean;
  /** Custom class name for container */
  className?: string;
  /** Whether disabled */
  disabled?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
}

/** File type configuration mapping */
const FILE_TYPE_CONFIG: Record<
  MultimodalFileType,
  {
    accept: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    colorClass: string;
    bgColorClass: string;
    borderColorClass: string;
  }
> = {
  image: {
    accept: ".jpg,.jpeg,.png,.gif,.webp,.bmp",
    icon: ImageIcon,
    label: "Image",
    colorClass: "text-emerald-500",
    bgColorClass: "bg-emerald-500/10",
    borderColorClass: "border-emerald-500/30 focus:border-emerald-500/60",
  },
  audio: {
    accept: ".mp3,.wav,.m4a,.flac,.ogg,.webm",
    icon: Mic,
    label: "Audio",
    colorClass: "text-cyan-500",
    bgColorClass: "bg-cyan-500/10",
    borderColorClass: "border-cyan-500/30 focus:border-cyan-500/60",
  },
  pdf: {
    accept: ".pdf",
    icon: FileText,
    label: "PDF",
    colorClass: "text-blue-500",
    bgColorClass: "bg-blue-500/10",
    borderColorClass: "border-blue-500/30 focus:border-blue-500/60",
  },
  video: {
    accept: ".mp4,.mov,.webm,.mkv,.avi,.m4v",
    icon: Video,
    label: "Video",
    colorClass: "text-orange-500",
    bgColorClass: "bg-orange-500/10",
    borderColorClass: "border-orange-500/30 focus:border-orange-500/60",
  },
};

/**
 * Format file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted size string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Detect file type from MIME type or extension
 * @param file - File object
 * @returns Detected file type category
 */
function detectFileType(file: File): MultimodalFileType {
  const mimeType = file.type.toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (
    mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)
  ) {
    return "image";
  }

  if (
    mimeType.startsWith("audio/") ||
    ["mp3", "wav", "m4a", "flac", "ogg", "webm", "aac"].includes(ext)
  ) {
    return "audio";
  }

  if (
    mimeType.startsWith("video/") ||
    ["mp4", "mov", "webm", "mkv", "avi", "m4v"].includes(ext)
  ) {
    return "video";
  }

  return "pdf";
}

/**
 * Generate unique ID
 * @returns Random string ID
 */
function generateId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Multi-modal file upload component with drag-and-drop support
 *
 * Features:
 * - Drag-and-drop file upload
 * - Multiple file type support (image/audio/PDF)
 * - File preview (image thumbnails)
 * - Size validation
 * - Type filtering
 *
 * @param props - Component properties
 * @returns JSX element
 */
export function MultimodalUpload({
  acceptedTypes = ["image", "audio", "pdf"],
  maxSizeMB = 50,
  maxFiles = 5,
  onFilesChange,
  value,
  showPreview = true,
  className = "",
  disabled = false,
  placeholder = "Drag & drop files here, or click to browse",
}: MultimodalUploadProps) {
  const [files, setFiles] = useState<UploadedFileInfo[]>(value || []);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Process and validate uploaded files
   * @param newFiles - FileList from input or drop event
   */
  const processFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(newFiles);

      if (files.length + fileArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const processedFiles: UploadedFileInfo[] = [];
      const acceptStrings = acceptedTypes.flatMap(
        (t) => FILE_TYPE_CONFIG[t].accept.split(",")
      );

      for (const file of fileArray) {
        const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const isAccepted = acceptStrings.some((accept) =>
          accept.trim().toLowerCase() === ext
        );

        if (!isAccepted) {
          setError(`Unsupported file type: ${file.name}`);
          continue;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`File too large: ${file.name} (${formatFileSize(file.size)} > ${maxSizeMB}MB)`);
          continue;
        }

        const fileType = detectFileType(file);
        let previewUrl = "";

        if (fileType === "image") {
          previewUrl = URL.createObjectURL(file);
        }

        processedFiles.push({
          id: generateId(),
          file,
          previewUrl,
          fileType,
          displaySize: formatFileSize(file.size),
        });
      }

      const updatedFiles = [...files, ...processedFiles];
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
    },
    [files, acceptedTypes, maxSizeMB, maxFiles, onFilesChange]
  );

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  /**
   * Handle drop event
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      if (e.dataTransfer.files?.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [disabled, processFiles]
  );

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  /**
   * Remove a specific file by ID
   * @param fileId - File ID to remove
   */
  const removeFile = useCallback(
    (fileId: string) => {
      const updatedFiles = files.filter((f) => f.id !== fileId);
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
    },
    [files, onFilesChange]
  );

  /**
   * Clear all files
   */
  const clearAllFiles = useCallback(() => {
    files.forEach((f) => {
      if (f.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });
    setFiles([]);
    onFilesChange?.([]);
    setError(null);
  }, [files, onFilesChange]);

  /** Build accept string for input element */
  const acceptString = acceptedTypes
    .flatMap((t) => FILE_TYPE_CONFIG[t].accept.split(","))
    .join(",");

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label={placeholder}
        title={placeholder}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            inputRef.current?.click();
          }
        }}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
            : "border-border hover:border-blue-400/50 bg-muted/30"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptString}
          multiple={maxFiles > 1}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
          aria-label="File upload input"
        />

        <Upload
          className={`h-10 w-10 mb-3 transition-colors ${
            isDragging ? "text-blue-500" : "text-muted-foreground"
          }`}
        />

        <p className="text-sm font-medium text-foreground text-center">
          {placeholder}
        </p>

        <p className="mt-2 text-xs text-muted-foreground text-center">
          Supported:{" "}
          {acceptedTypes.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 mr-2">
              {(() => {
                const Icon = FILE_TYPE_CONFIG[t].icon;
                return <Icon className={`h-3 w-3 ${FILE_TYPE_CONFIG[t].colorClass}`} />;
              })()}
              <span>{FILE_TYPE_CONFIG[t].label}</span>
            </span>
          ))}
          {" "}Max {maxSizeMB}MB each
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-600"
            aria-label="Dismiss error"
            title="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* File previews */}
      {showPreview && files.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFiles}
              className="h-7 text-xs text-muted-foreground hover:text-red-500"
              type="button"
            >
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((fileInfo) => {
              const config = FILE_TYPE_CONFIG[fileInfo.fileType];
              const Icon = config.icon;

              return (
                <div
                  key={fileInfo.id}
                  className={`group relative rounded-xl border overflow-hidden transition-all ${
                    config.borderColorClass
                  }`}
                >
                  {fileInfo.fileType === "image" && fileInfo.previewUrl ? (
                    <div className="aspect-square relative bg-slate-100 dark:bg-slate-800">
                      <img
                        src={fileInfo.previewUrl}
                        alt={fileInfo.file.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => removeFile(fileInfo.id)}
                          type="button"
                          aria-label={`Remove ${fileInfo.file.name}`}
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`aspect-square flex flex-col items-center justify-center p-3 ${config.bgColorClass}`}
                    >
                      <Icon className={`h-8 w-8 mb-2 ${config.colorClass}`} />
                      <p className="text-xs font-medium text-foreground truncate w-full text-center">
                        {fileInfo.file.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {fileInfo.displaySize}
                      </p>
                    </div>
                  )}

                  {/* Remove button for non-image files */}
                  {fileInfo.fileType !== "image" && (
                    <button
                      type="button"
                      onClick={() => removeFile(fileInfo.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background rounded-full p-1"
                      aria-label={`Remove ${fileInfo.file.name}`}
                      title="Remove file"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
