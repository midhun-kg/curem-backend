const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Import the new docClient instance and the specific QueryCommand class
const { docClient, QueryCommand } = require('/opt/nodejs/helpers/dbClient'); 
// Assuming response helper is in the same directory
const { response } = require('/opt/nodejs/helpers/response');

const USERS_TABLE = process.env.USERS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return response(400, { message: "Missing credentials" });
    }

    // 3. Create a new QueryCommand with the same parameters as before
    const command = new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :e',
      ExpressionAttributeValues: { ':e': email }
    });

    // 4. Send the command using the docClient
    const userQuery = await docClient.send(command);

    // 5. The result structure is the same, so this logic doesn't change
    if (userQuery.Count === 0) {
      return response(401, { message: "Invalid email or password" });
    }

    const user = userQuery.Items[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return response(401, { message: "Invalid email or password" });
    }

    const token = jwt.sign({
      id: user.userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }, JWT_SECRET, { expiresIn: '1d' });

    return response(200, { token });

  } catch (err) {
    console.error(err);
    return response(500, { message: "Internal server error" });
  }
};