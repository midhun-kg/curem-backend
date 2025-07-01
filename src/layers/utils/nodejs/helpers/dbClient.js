const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand,
  ScanCommand, 
  UpdateCommand, 
  DeleteCommand 
} = require("@aws-sdk/lib-dynamodb");

const isLocal = process.env.AWS_SAM_LOCAL;

const clientOptions = {};

if (isLocal) {
  console.log('SAM Local detected. Configuring for local DynamoDB.');
  clientOptions.region = 'local';
  clientOptions.endpoint = 'http://host.docker.internal:8000';
  
  clientOptions.credentials = {
    accessKeyId: 'dummyKeyId',
    secretAccessKey: 'dummySecretKey'
  };
}

const client = new DynamoDBClient(clientOptions);

const docClient = DynamoDBDocumentClient.from(client);

module.exports = {
  docClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
  DeleteCommand
};