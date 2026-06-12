/** One object to write to storage: its full key, raw bytes, and MIME type. */
export type UploadInput = {
  key: string;
  body: Buffer;
  content_type: string;
};
