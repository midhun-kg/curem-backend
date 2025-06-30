const { v4: uuidv4 } = require('/opt/nodejs/node_modules/uuid');
const {
  S3Client,
  PutObjectCommand
} = require('@aws-sdk/client-s3');
const {
  getSignedUrl
} = require('@aws-sdk/s3-request-presigner');
const {
  docClient,
  PutCommand
} = require('/opt/nodejs/helpers/dbClient');
const { response } = require('/opt/nodejs/helpers/response');

const ANALYSIS_TABLE = process.env.ANALYSIS_TABLE;
const BUCKET = process.env.UPLOAD_BUCKET;
const REGION = process.env.REGION;
const s3 = new S3Client({ region: REGION });

exports.handler = async (event) => {
  try {
    const { patientId, deviceId, imageCount = 1 } = JSON.parse(event.body);

    if (!patientId || !deviceId || imageCount <= 0) {
      return response(400, { message: "Missing or invalid patientId/deviceId/imageCount" });
    }

    const analysisId = uuidv4();
    const createdAt = new Date().toISOString();

    // Save analysis record in DB
    const putCommand = new PutCommand({
      TableName: ANALYSIS_TABLE,
      Item: {
        analysisId,
        patientId,
        deviceId,
        result: 'PENDING',
        createdAt
      },
    });
    await docClient.send(putCommand);

    // Generate pre-signed URLs
    const uploadUrls = await Promise.all(
      Array.from({ length: imageCount }).map(async (_, i) => {
        const imageId = uuidv4();
        const key = `patients/${patientId}/analysis/${analysisId}/raw/${imageId}.png`;

        const command = new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          ContentType: 'image/png'
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        return { key, url: signedUrl };
      })
    );

    return response(201, {
      analysisId,
      uploadUrls
    });

  } catch (err) {
    console.error("Submit Analysis Error:", err);
    return response(500, { message: "Failed to submit analysis" });
  }
};
