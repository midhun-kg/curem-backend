const AWS = require('aws-sdk');

function getDynamoClient() {
  const isLocal = process.env.AWS_SAM_LOCAL;
  return isLocal
    ? new AWS.DynamoDB.DocumentClient({
        endpoint: 'http://host.docker.internal:8000',
        region: 'us-east-1',
      })
    : new AWS.DynamoDB.DocumentClient();
}

module.exports = { getDynamoClient };
