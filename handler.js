'use strict';
const uuid = require("uuid");
const AWS = require("aws-sdk");

const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const messagesTableName = "messages";

// //to use for local and prod
const dynamodb = require('serverless-dynamodb-client');
const docClient = dynamodb.doc;

//temp for local rn
// const docClient = new AWS.DynamoDB.DocumentClient({
//     region: 'localhost',
//     endpoint: 'http://localhost:8000',
//     accessKeyId: 'DEFAULT_ACCESS_KEY',  // needed if you don't have aws credentials at all in env
//     secretAccessKey: 'DEFAULT_SECRET' // needed if you don't have aws credentials at all in env
// });


async function produce(text, groupId, dedupId) {
    return await sqs
        .sendMessage({
            MessageBody: text,
            MessageGroupId: groupId,
            MessageDeduplicationId: dedupId,
            QueueUrl: "https://sqs.eu-central-1.amazonaws.com/587994125269/sqs-queue-autoping-inbound.fifo"
        })
        .promise();
}

module.exports.handleOutboundMessageSqs = async (event) => {
    const records = event.Records;
    for (var i = 0; i < records.length; i++) {
        const message = JSON.parse(records[i].body);
        console.log("Outbound message received (from SQS): " + JSON.stringify(message));

        let params = {
            TableName: messagesTableName,
            Item: message
        };

        let result = await docClient.put(params).promise();
    }

}
module.exports.getMessages = async (event) => {
    console.log("Get messages request received: " + JSON.stringify(event.queryStringParameters));
    let m = [];
    if (event.queryStringParameters
        && event.queryStringParameters.initiatorId
        && event.queryStringParameters.cardId) {

        m = await getMessages(event.queryStringParameters.initiatorId, event.queryStringParameters.cardId, +event.queryStringParameters.fromTime || 1);
    }

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*"
        },
        body: JSON.stringify({
            items: m.Items
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

    let params = {
        TableName: messagesTableName,
        Item: message
    };

    let result = await docClient.put(params).promise();

    await produce(JSON.stringify(message), message.cardId, message.id);

    return {
        statusCode: statusCode,
        body: JSON.stringify(message),
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*"
        }
    };
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
