'use strict';

const AWS = require("aws-sdk");

const messagesTableName = "messages";

//to use for local and prod
const dynamodb = require('serverless-dynamodb-client');
const docClient = dynamodb.doc;

//temp for local rn


// const docClient = new AWS.DynamoDB.DocumentClient({
//     region: 'localhost',
//     endpoint: 'http://localhost:8000',
//     accessKeyId: 'DEFAULT_ACCESS_KEY',  // needed if you don't have aws credentials at all in env
//     secretAccessKey: 'DEFAULT_SECRET' // needed if you don't have aws credentials at all in env
// });


module.exports.getMessages = async function (fingerPrint, cardId) {
  let params = {
    TableName: messagesTableName,
    FilterExpression: " fingerPrint = :f AND cardId = :c ",
    ExpressionAttributeValues: {
      ":f": fingerPrint,
      ":c": cardId
    }
  }
  return await docClient.scan(params).promise();
};

module.exports.getMessages = async (event) => {
  console.log("Get messages request received: " + JSON.stringify(event.body));
  console.log(event);
  // let m = getMessages(event.);
  return {
    statusCode: 200,
    body: JSON.stringify({
      items: [
        {
          id: "3ac2a3f9-b9b7-481c-aa00-32543eaffd32",
          dialogId: "e6e1aa11-b93e-4371-8213-fa21a50747d8",
          author: "John",
          text: "Please move your car",
          createdAt: 1641619332
        }
      ]
    })
  }
}

module.exports.sendMessage = async (event) => {
  console.log("Outbound message received: " + JSON.stringify(event.body));
  return {statusCode: 201};
}
