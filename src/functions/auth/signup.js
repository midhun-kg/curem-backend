const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('/opt/nodejs/node_modules/uuid');

// 1. Import the new docClient and the specific Command classes you need
const { docClient, QueryCommand, PutCommand } = require('/opt/nodejs/helpers/dbClient');
const { response } = require('/opt/nodejs/helpers/response');

const USERS_TABLE = process.env.USERS_TABLE;

exports.handler = async (event) => {
  try {
    const { email, password, fullName } = JSON.parse(event.body);

    if (!email || !password || !fullName) {
      return response(400, { message: "Missing required fields: email, password, fullName" });
    }

    // --- Check if user already exists (SDK v3 style) ---
    const queryCommand = new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :e',
      ExpressionAttributeValues: { ':e': email },
    });
    const { Count } = await docClient.send(queryCommand);

    if (Count > 0) {
      return response(409, { message: "A user with this email already exists" });
    }

    // --- Create the new user ---
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a PutCommand to insert the new user item
    const putCommand = new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        userId,
        email,
        fullName,
        password: hashedPassword,
        role: 'standard_user',
        createdAt: new Date().toISOString(),
      },
    });
    await docClient.send(putCommand);

    return response(201, { message: "User created successfully", userId });

  } catch (err) {
    console.error("Signup Error:", err);
    return response(500, { message: "Internal server error during user creation" });
  }
};