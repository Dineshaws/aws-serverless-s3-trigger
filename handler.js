'use strict';
const fetch = require('node-fetch');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const fs = require('fs');
const uuid = require('uuid');


const s3 = new AWS.S3();
module.exports.comment = (event, context, callback) => {
  console.log("params ",event.pathParameters);
  let params = event.pathParameters;

  const fileName = uuid.v1();
  const filePath = fileName+".json";
  const comment_api_path = process.env.API_BASE_PATH+ '/comments/' +params.id;
  console.log("filePath ",filePath)
  fetch(comment_api_path)
  .then(function(response){
    console.log("response.status",response.status)
        return response.json();
  })
  .then(function(json){
      console.log("json => ",json);
      fs.writeFile(filePath, JSON.stringify(json), 'utf8', (error) => {
        if (error) {
              console.log("Error creating jsonFile: ", error);
        } else {
          const jsonFileStream= fs.createReadStream(filePath);
          const params = { 
              Bucket: process.env.BUCKET,
              Key: `comments${filePath}`,
              Body:jsonFileStream
          };
          s3.putObject(params, function (err, data) {
              if (err) {
                  console.log("Error uploading jsonFile: ", err);
                } else {
                  fs.unlink(filePath, function(err) {
                      if(err && err.code == 'ENOENT') {
                          // file doens't exist
                          console.info("File doesn't exist, won't remove it.");
                      } else if (err) {
                          // other errors, e.g. maybe we don't have enough permission
                          console.error("Error occurred while trying to remove file");
                      } else {
                          console.info(`removed`);
                      }
                  });
                  console.log("Successfully uploaded jsonFile on S3", data);
                  const response = {
                    statusCode: 200,
                    body: JSON.stringify({
                      message: 'Go Serverless v1.0! Your function executed successfully!'
                    }),
                  };

                  callback(null, response);
                }
          }); 
        }
      });
  });
  
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
