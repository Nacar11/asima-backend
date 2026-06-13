/** Metadata for an object that lives in the bucket. */
export type StoredObject = {
  bucket: string;
  key: string;
  content_type: string;
  size_bytes: number;
};
