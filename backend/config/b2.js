const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: process.env.B2_REGION,

    credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY
    },

    forcePathStyle: true
});

module.exports = s3;
