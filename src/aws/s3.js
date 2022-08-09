const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  apiVersion: "2012-11-05",
  endpoint: "https://s3.us-east-1.amazonaws.com",
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

exports.getObjectUrl = function (key, file) {
  var params = {
    Bucket: "artkey",
    Key: key,
  };

  if (file != null) {
    params["ResponseContentDisposition"] = `attachment; filename="${file}"`;
  }

  var objectUrlPromise = s3.getSignedUrlPromise("getObject", params);
  return objectUrlPromise;
};
