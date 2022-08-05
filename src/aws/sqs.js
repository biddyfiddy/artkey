var AWS = require("aws-sdk");

const sqs = new AWS.SQS({
  apiVersion: "2012-11-05",
  endpoint: "https://sqs.us-east-1.amazonaws.com",
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

/**
 * Send a message to an SQS queue
 *
 * @param {*} message the message to send
 * @param {*} queueUrl the queue for which to send the message
 */
exports.sendMsg = function (message, queueUrl) {
  const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: queueUrl,
  };

  return sqs.sendMessage(params).promise();
};
