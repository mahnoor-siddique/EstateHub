import "server-only";
import { DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3";
import { s3Bucket, s3ObjectUrl } from "./urls";

/** Stores a new object and returns its URL. Never overwrites an existing key. */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: s3Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
      IfNoneMatch: "*",
    })
  );

  return s3ObjectUrl(key);
}

/** Deletes objects by key. Throws if the request fails or S3 reports any key as not deleted. */
export async function deleteFromS3(keys: string[]) {
  if (keys.length === 0) return;

  const result = await s3.send(
    new DeleteObjectsCommand({
      Bucket: s3Bucket(),
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    })
  );

  if (result.Errors?.length) {
    throw new Error(`S3 could not delete ${result.Errors.length} object(s): ${result.Errors[0].Code}`);
  }
}
