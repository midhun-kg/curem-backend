const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDynamoClient } = require('/opt/helpers/dbClient');
const { response } = require('/opt/helpers/response');

const dynamo = getDynamoClient();
const USERS_TABLE = process.env.USERS_TABLE;

exports.handler = async (event) => {
  try {
    const { email, password, fullName } = JSON.parse(event.body);

    if (!email || !password || !fullName) {
      return response(400, { message: "Missing fields" });
    }

    const existing = await dynamo.query({
      TableName: USERS_TABLE,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :e',
      ExpressionAttributeValues: { ':e': email },
    }).promise();

    if (existing.Count > 0) {
      return response(409, { message: "User already exists" });
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await dynamo.put({
      TableName: USERS_TABLE,
      Item: {
        userId,
        email,
        fullName,
        password: hashedPassword,
        role: 'standard_user',
        createdAt: new Date().toISOString(),
      },
    }).promise();

    return response(201, { message: "User created", userId });
  } catch (err) {
    console.error(err);
    return response(500, { message: "Internal server error" });
  }
};
