var AWS = require("aws-sdk");

const sns = new AWS.SNS({
  apiVersion: "2012-11-05",
  endpoint: "https://sns.us-east-1.amazonaws.com",
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
exports.subscribe = function (wss) {
    console.log(process.env.EC2_HOSTNAME)
    if (process.env.EC2_HOSTNAME == "localhost") {
        return
    }

    let params = {
        Protocol: 'HTTPS',
        TopicArn: 'arn:aws:sns:us-east-1:810159986268:completion-topic',
        Endpoint: 'https://' + process.env.EC2_HOSTNAME + '/complete'
    };

    sns.subscribe(params, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
            console.log(wss)
        }
    });


};
