const {
  docClient,
  GetCommand,
  QueryCommand
} = require('/opt/nodejs/helpers/dbClient');
const { response } = require('/opt/nodejs/helpers/response');

const REPORTS_TABLE = process.env.REPORTS_TABLE;

/**
 * Decode base64 pagination token
 */
const decodeToken = (token) =>
  token ? JSON.parse(Buffer.from(token, 'base64').toString('utf8')) : undefined;

/**
 * Encode pagination token
 */
const encodeToken = (key) =>
  Buffer.from(JSON.stringify(key)).toString('base64');

/**
 * Query DynamoDB with optional date filtering and pagination
 */
async function queryWithDateRange(indexName, hashKeyName, hashKeyValue, start, end, limit, nextToken) {
  const params = {
    TableName: REPORTS_TABLE,
    IndexName: indexName,
    KeyConditionExpression: `${hashKeyName} = :id` + (start && end ? ' AND createdAt BETWEEN :start AND :end' : ''),
    ExpressionAttributeValues: {
      ':id': hashKeyValue,
      ...(start && end ? { ':start': start, ':end': end } : {})
    },
    Limit: limit || 10,
    ...(nextToken ? { ExclusiveStartKey: decodeToken(nextToken) } : {})
  };

  const result = await docClient.send(new QueryCommand(params));

  return {
    items: result.Items || [],
    nextToken: result.LastEvaluatedKey ? encodeToken(result.LastEvaluatedKey) : null
  };
}

exports.handler = async (event) => {
  try {
    const { httpMethod, path, pathParameters, queryStringParameters } = event;

    if (httpMethod !== 'GET') {
      return response(405, { message: "Method not allowed" });
    }

    const limit = parseInt(queryStringParameters?.limit || '10');
    const start = queryStringParameters?.start;
    const end = queryStringParameters?.end;
    const nextToken = queryStringParameters?.nextToken;

    // ─── GET /reports/user/{userId} ───────────────────────────────
    if (path.startsWith('/reports/user/')) {
      const userId = pathParameters.userId;
      if (!userId) return response(400, { message: "Missing userId" });

      const result = await queryWithDateRange(
        'UserReportsIndex',
        'userId',
        userId,
        start,
        end,
        limit,
        nextToken
      );

      return response(200, result);
    }

    // ─── GET /reports/patient/{patientId} ─────────────────────────
    if (path.startsWith('/reports/patient/')) {
      const patientId = pathParameters.patientId;
      if (!patientId) return response(400, { message: "Missing patientId" });

      const result = await queryWithDateRange(
        'PatientReportsIndex',
        'patientId',
        patientId,
        start,
        end,
        limit,
        nextToken
      );

      return response(200, result);
    }

    // ─── GET /reports/{reportId} ──────────────────────────────────
    if (path.startsWith('/reports/')) {
      const reportId = pathParameters.reportId;
      if (!reportId) return response(400, { message: "Missing reportId" });

      const result = await docClient.send(new GetCommand({
        TableName: REPORTS_TABLE,
        Key: { reportId }
      }));

      if (!result.Item) return response(404, { message: "Report not found" });

      return response(200, result.Item);
    }

    // ─── Unknown route ────────────────────────────────────────────
    return response(400, { message: "Invalid reports route" });

  } catch (err) {
    console.error("Manage Reports Error:", err);
    return response(500, { message: "Failed to retrieve report(s)" });
  }
};
