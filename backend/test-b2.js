require("dotenv").config();

const {
    ListBucketsCommand
} = require("@aws-sdk/client-s3");

const s3 = require("./config/b2");

async function testB2() {
    try {
        const result = await s3.send(new ListBucketsCommand({}));

        console.log("✅ Backblaze B2 Connected Successfully!");

        if (result.Buckets) {
            console.log("Buckets:");

            result.Buckets.forEach(bucket => {
                console.log("-", bucket.Name);
            });
        }

    } catch (error) {
        console.error("❌ Backblaze B2 Connection Failed:");
        console.error(error.message);
    }
}

testB2();
