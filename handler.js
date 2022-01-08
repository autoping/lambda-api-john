'use strict';

module.exports.sendMessage = async (event) => {
  console.log("Outbound message received: " + JSON.stringify(event.body));
}
