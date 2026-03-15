export const ACCEPT = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";
export const MAX_SIZE_MB = 30;
export const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only PDF, PNG, and JPEG files are allowed.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File must be under ${MAX_SIZE_MB}MB.`;
  }
  return null;
}
