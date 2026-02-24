// Image upload handler with progress tracking and abort support.
// Converts images to base64 data URLs for inline embedding.
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Handles image upload with progress tracking and abort capability.
 * Reads the file as a base64 data URL for inline embedding.
 * @param file The file to upload
 * @param onProgress Optional callback for tracking upload progress
 * @param abortSignal Optional AbortSignal for cancelling the upload
 * @returns Promise resolving to the data URL of the image
 */
export const handleImageUpload = async (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal,
): Promise<string> => {
  if (!file) {
    throw new Error("No file provided");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
  }

  onProgress?.({ progress: 0 });

  const dataUrl = await new Promise<string>((resolve, reject) => {
    if (abortSignal?.aborted) {
      reject(new Error("Upload cancelled"));
      return;
    }

    const reader = new FileReader();

    const onAbort = () => {
      reader.abort();
      reject(new Error("Upload cancelled"));
    };
    abortSignal?.addEventListener("abort", onAbort, { once: true });

    reader.onload = (e) => {
      abortSignal?.removeEventListener("abort", onAbort);
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error("Failed to read file"));
        return;
      }
      resolve(result);
    };

    reader.onerror = () => {
      abortSignal?.removeEventListener("abort", onAbort);
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });

  onProgress?.({ progress: 100 });

  return dataUrl;
};
