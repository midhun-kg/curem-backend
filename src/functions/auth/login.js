const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDynamoClient } = require('/opt/helpers/dbClient');
const { response } = require('/opt/helpers/response');

const dynamo = getDynamoClient();
const USERS_TABLE = process.env.USERS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return response(400, { message: "Missing credentials" });
    }

    // Fetch user by email from GSI
    const userQuery = await dynamo.query({
      TableName: USERS_TABLE,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :e',
      ExpressionAttributeValues: { ':e': email }
    }).promise();

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
