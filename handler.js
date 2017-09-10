'use strict';
const fetch = require('node-fetch');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const uuid = require('uuid');


const s3 = new AWS.S3({'region': 'us-east-1'}); //region should be same as lamda function
module.exports.comment = (event, context, callback) => {
  console.log("params ",event.pathParameters);
  let params = event.pathParameters;

  const fileName = uuid.v1(); // create file name(random name with uuid)
  const filePath = fileName+".json";
  const comment_api_path = process.env.API_BASE_PATH+ '/comments/' +params.id;
  console.log("filePath ",filePath)
  fetch(comment_api_path)
  .then(response => {
    console.log("response.status",response.status);
    return response.json(); // return json object here
  })
  .then(json => {
      let jsonFileStream = new Buffer.from(JSON.stringify(json)); // JSON Object to Buffer
      //console.log("jsonFileStream => ",jsonFileStream);
      const params = { 
          Bucket: process.env.BUCKET,
          Key: `comments_${filePath}`,
          Body: jsonFileStream
      };
      s3.putObject(params, function (err, data) {
          if (err) {
            console.log("Error uploading jsonFile: ", err);
            return Promise.reject(new Error(`Failed to upload file on s3 Bucket`));
          } else {
            console.log("Successfully uploaded jsonFile on S3", data);
            const response = {
              statusCode: 200,
              body: JSON.stringify({
                message: `Lamda function getComment executed successfully! comment_${filePath} file uploaded to S3.`
              }),
            };

            callback(null, response);
          }
      }); 
  });
  
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};


module.exports.parser = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };
    s3.getObject(params, (err, data) => {
        if (err) {
            console.log(err);
            const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
            console.log(message);
            callback(message);
        } else {
            console.log('CONTENT:', data);
            console.log('CONTENT TYPE:', data.ContentType);
            try{
              let parsedCommentJson = JSON.parse(data.Body.toString()); //Buffer to JSON Object
              console.log('parsedCommentJson:', parsedCommentJson);
            } catch(e) {
               console.error(e);
            }
            callback(null, data.ContentType);
        }
    });
};