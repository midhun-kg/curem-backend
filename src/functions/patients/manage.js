const { v4: uuidv4 } = require('/opt/nodejs/node_modules/uuid');
const {
  docClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand
} = require('/opt/nodejs/helpers/dbClient');
const { response } = require('/opt/nodejs/helpers/response');

const PATIENTS_TABLE = process.env.PATIENTS_TABLE;

exports.handler = async (event) => {
  const method = event.httpMethod;
  const patientId = event.pathParameters?.patientId;

  try {
    switch (method) {
      // CREATE
      case 'POST': {
        const { fullName, age, gender, userId } = JSON.parse(event.body);
        if (!fullName || !userId) {
          return response(400, { message: "Missing fullName or userId" });
        }
        const newPatientId = uuidv4();
        const timestamp = new Date().toISOString();

        await docClient.send(new PutCommand({
          TableName: PATIENTS_TABLE,
          Item: {
            patientId: newPatientId,
            userId,
            fullName,
            age,
            gender,
            createdAt: timestamp,
            updatedAt: timestamp
          }
        }));
        return response(201, { patientId: newPatientId });
      }

      // READ
      case 'GET': {
        const userId = event.queryStringParameters?.userId;
        if (!userId) return response(400, { message: "Missing userId" });

        const query = new QueryCommand({
          TableName: PATIENTS_TABLE,
          IndexName: 'UserPatientsIndex',
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': userId }
        });

        const result = await docClient.send(query);
        return response(200, result.Items);
      }

      // UPDATE
      case 'PUT': {
        if (!patientId) return response(400, { message: "Missing patientId" });

        const { fullName, age, gender } = JSON.parse(event.body);
        const updates = [];
        const values = { ':updatedAt': new Date().toISOString() };

        if (fullName) { updates.push('fullName = :fn'); values[':fn'] = fullName; }
        if (age)      { updates.push('age = :age');     values[':age'] = age; }
        if (gender)   { updates.push('gender = :g');    values[':g'] = gender; }
        updates.push('updatedAt = :updatedAt');

        await docClient.send(new UpdateCommand({
          TableName: PATIENTS_TABLE,
          Key: { patientId },
          UpdateExpression: `SET ${updates.join(', ')}`,
          ExpressionAttributeValues: values
        }));

        return response(200, { message: "Patient updated" });
      }

      // DELETE
      case 'DELETE': {
        if (!patientId) return response(400, { message: "Missing patientId" });

        await docClient.send(new DeleteCommand({
          TableName: PATIENTS_TABLE,
          Key: { patientId }
        }));

        return response(200, { message: "Patient deleted" });
      }

      default:
        return response(405, { message: "Method not allowed" });
    }
  } catch (err) {
    console.error("Manage Patient Error:", err);
    return response(500, { message: "Something went wrong" });
  }
};
