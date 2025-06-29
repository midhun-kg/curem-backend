function response(statusCode, body = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Optional: for CORS
    },
    body: JSON.stringify(body),
  };
}

module.exports = { response };
