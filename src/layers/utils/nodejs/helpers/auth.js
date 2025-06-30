const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(event) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader) throw new Error("Missing Authorization header");

  const token = authHeader.replace(/^Bearer /, '');
  const decoded = jwt.verify(token, JWT_SECRET);

  if (decoded.role !== 'admin_user') {
    throw new Error("Access denied");
  }

  return decoded;
}

module.exports = { verifyToken };
