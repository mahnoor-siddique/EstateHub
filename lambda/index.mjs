import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const item = {
    id: crypto.randomUUID(),
    type: "property_view",
    timestamp: new Date().toISOString()
  };

  await dynamodb.send(
    new PutCommand({
      TableName: "estatehub-activity",
      Item: item
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Activity saved successfully",
      activity: item
    })
  };
};