'use strict';

module.exports.getMessages = async (event) => {
  console.log("Get messages request received: " + JSON.stringify(event.body));
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
