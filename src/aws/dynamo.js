const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB({
  apiVersion: "2012-11-05",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com",
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const ddbDocumentClient = new AWS.DynamoDB.DocumentClient({
  service: ddb,
});

exports.getWhiteListedWalletsPromise = function () {
  var getWhiteListedWalletsPromise = null;
  try {
    var params = {
      TableName: "SlimeTable",
      ProjectionExpression: "#walletAddress",
      ExpressionAttributeNames: {
        "#walletAddress": "walletAddress",
      },
    };

    getWhiteListedWalletsPromise = ddbDocumentClient.scan(params).promise();
  } catch (error) {
    console.error(error);
    getWhiteListedWalletsPromise = null;
  }

  return getWhiteListedWalletsPromise;
};

exports.updateJob = function (walletAddress, imagePhrase, imageName) {
  var createPreferencePromise = null;
  try {
    var params = {
      TableName: "SlimeTable",
      Key: {
        walletAddress: walletAddress,
      },
      UpdateExpression: `set imagePhrase = :imagePhrase, imageName = :imageName, imageKey = :imageKey, imageStatus = :imageStatus`,
      ExpressionAttributeValues: {
        ":imagePhrase": imagePhrase,
        ":imageName": imageName,
        ":imageKey": "",
        ":imageStatus": "queued",
      },
    };
    createPreferencePromise = ddbDocumentClient.update(params).promise();
  } catch (error) {
    console.error(error);
    createPreferencePromise = null;
  }

  return createPreferencePromise;
};

exports.getSituationFromWallet = function (walletAddress) {
  var getImagesFromWalletPromise = null;
  try {
    var params = {
      TableName: "SlimeTable",
      Key: {
        walletAddress: walletAddress,
      },
      AttributesToGet: [
        "walletAddress",
        "imagePhrase",
        "imageName",
        "imageKey",
        "imageStatus",
      ],
    };

    getImagesFromWalletPromise = ddbDocumentClient.get(params).promise();
  } catch (error) {
    console.error(error);
    getImagesFromWalletPromise = null;
  }

  return getImagesFromWalletPromise;
};
