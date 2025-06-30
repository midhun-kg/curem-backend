const { v4: uuidv4 } = require('/opt/nodejs/node_modules/uuid');
const {
  docClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} = require('/opt/nodejs/helpers/dbClient');
const { verifyToken } = require('/opt/nodejs/helpers/auth');
const { response } = require('/opt/nodejs/helpers/response');

const DEVICES_TABLE = process.env.DEVICES_TABLE;

exports.handler = async (event) => {
  const method = event.httpMethod;
  const deviceId = event.pathParameters?.deviceId;

  try {
    const user = verifyToken(event); // Ensure only admin_user proceeds

    switch (method) {
      // CREATE
      case 'POST': {
        const { name, model, location } = JSON.parse(event.body);
        if (!name || !model) {
          return response(400, { message: "Missing name or model" });
        }

        const id = uuidv4();
        const createdAt = new Date().toISOString();

        await docClient.send(new PutCommand({
          TableName: DEVICES_TABLE,
          Item: {
            deviceId: id,
            name,
            model,
            location,
            createdAt,
            updatedAt: createdAt
          }
        }));

        return response(201, { deviceId: id });
      }

      // READ (list all)
      case 'GET': {
        const result = await docClient.send(new ScanCommand({ TableName: DEVICES_TABLE }));
        return response(200, result.Items);
      }

      // UPDATE
      case 'PUT': {
        if (!deviceId) return response(400, { message: "Missing deviceId" });

        const { name, model, location } = JSON.parse(event.body);
        const expr = [];
        const values = { ':updatedAt': new Date().toISOString() };

        if (name) { expr.push('name = :n'); values[':n'] = name; }
        if (model) { expr.push('model = :m'); values[':m'] = model; }
        if (location) { expr.push('location = :l'); values[':l'] = location; }
        expr.push('updatedAt = :updatedAt');

        await docClient.send(new UpdateCommand({
          TableName: DEVICES_TABLE,
          Key: { deviceId },
          UpdateExpression: `SET ${expr.join(', ')}`,
          ExpressionAttributeValues: values
        }));

        return response(200, { message: "Device updated" });
      }

      // DELETE
      case 'DELETE': {
        if (!deviceId) return response(400, { message: "Missing deviceId" });

        await docClient.send(new DeleteCommand({
          TableName: DEVICES_TABLE,
          Key: { deviceId }
        }));

        return response(200, { message: "Device deleted" });
      }

      default:
        return response(405, { message: "Method not allowed" });
    }

  } catch (err) {
    console.error("Device Management Error:", err);
    return response(403, { message: err.message || "Access denied" });
  }
};
