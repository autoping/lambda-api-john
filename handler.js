'use strict';
const uuid = require("uuid");
const AWS = require("aws-sdk");

const messagesTableName = "messages";

//to use for local and prod
// const dynamodb = require('serverless-dynamodb-client');
// const docClient = dynamodb.doc;

//temp for local rn
const docClient = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'DEFAULT_ACCESS_KEY',  // needed if you don't have aws credentials at all in env
    secretAccessKey: 'DEFAULT_SECRET' // needed if you don't have aws credentials at all in env
});


module.exports.getMessages = async (event) => {
    console.log("Get messages request received: " + JSON.stringify(event.queryStringParameters));
    let m = [];
    if (event.queryStringParameters
        && event.queryStringParameters.initiatorId
        && event.queryStringParameters.cardId) {

        m = await getMessages(event.queryStringParameters.initiatorId, event.queryStringParameters.cardId, +event.queryStringParameters.fromTime||1);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            items: m
        })
    }
}

module.exports.sendMessage = async (event) => {
    console.log("Outbound message received: " + JSON.stringify(event.body));
    const messageInput = JSON.parse(event.body);
    let statusCode = 201;

    const message = {
        id: uuid.v4(),
        text: messageInput.text,
        cardId: messageInput.cardId,
        initiatorId: messageInput.initiatorId,
        createdAt: Math.floor(Date.now() / 1000),
        inbound: true
    }
    //todo: validate

    let params = {
        TableName: messagesTableName,
        Item: message
    };

    let result = await docClient.put(params).promise();
    console.log(result);
    return {statusCode: statusCode};
}

const getMessages = async function (initiatorId, cardId, fromTime) {
    let params = {
        TableName: messagesTableName,
        FilterExpression: " initiatorId = :initiatorId AND cardId = :cardId AND createdAt > :fromTime",
        ExpressionAttributeValues: {
            ":initiatorId": initiatorId,
            ":cardId": cardId,
            ":fromTime": fromTime
        }
    }
    return await docClient.scan(params).promise();
};
