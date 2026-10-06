import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

// Credentials come from the AWS SDK's default provider chain (IAM role, or a local AWS login);
// no access keys are stored in the project.
export const s3 = new S3Client({
  region: process.env.AWS_REGION,
});
