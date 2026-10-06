import "server-only";

/** The image bucket's name. Read when needed (not at import), so builds and tests can load this file. */
export function s3Bucket(): string {
  const bucket = process.env.AWS_S3_BUCKET;

  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }

  return bucket;
}

function bucketUrl(bucket: string): string {
  return `https://${bucket}.s3.eu-north-1.amazonaws.com/`;
}

export function s3ObjectUrl(key: string): string {
  const encodedKey = key
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

  return `${bucketUrl(s3Bucket())}${encodedKey}`;
}

/** The object key behind a URL made by s3ObjectUrl, or null for any other URL. */
export function s3KeyFromUrl(url: string): string | null {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) return null;

  const base = bucketUrl(bucket);
  if (!url.startsWith(base)) return null;

  try {
    return url.slice(base.length).split("/").map(decodeURIComponent).join("/") || null;
  } catch {
    return null;
  }
}
