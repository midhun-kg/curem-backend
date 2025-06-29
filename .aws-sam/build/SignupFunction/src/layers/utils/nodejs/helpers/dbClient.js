const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand, 
  DeleteCommand 
} = require("@aws-sdk/lib-dynamodb");

// Check if we are running locally by checking the standard SAM CLI environment variable
const isLocal = process.env.AWS_SAM_LOCAL;

// Create a configuration object that we will pass to the DynamoDB client
const clientOptions = {};

if (isLocal) {
  console.log('SAM Local detected. Configuring for local DynamoDB.');
  clientOptions.region = 'local'; // The region for local DynamoDB is arbitrary
  clientOptions.endpoint = 'http://host.docker.internal:8000';
  
  // For local development, you MUST provide dummy credentials.
  // The AWS SDK v3 is stricter about this than v2.
  clientOptions.credentials = {
    accessKeyId: 'dummyKeyId',
    secretAccessKey: 'dummySecretKey'
  };
}
// If not running locally, the clientOptions object remains empty.
// The SDK will then automatically use the IAM Role credentials and region
// from the Lambda function's execution environment in the AWS cloud.


// Create the base DynamoDB client with our configured options
const client = new DynamoDBClient(clientOptions);

// Create the DocumentClient by wrapping the base client.
// This is what you will use in your functions to interact with DynamoDB.
const docClient = DynamoDBDocumentClient.from(client);

// Export the single, configured docClient instance AND the command classes.
// Your functions will import these to build their database queries.
module.exports = {
  docClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand
};