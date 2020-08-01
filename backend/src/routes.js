const express = require('express')
const requestAPI = require('request')
const fs = require('fs');
const http = require('http');

const routes = express.Router();

const Wait = require('./resources/wait');

const messageID = require('./constants/messageID');

routes.post('/', (req, res) => {

  if (req.body.type !== 'MESSAGE')
    return console.log(req.body.type);

  if (messageID.findIndex(message => message.id == req.body.message.id) != '-1')
    return console.log('messagem já cadastrada');

  const responseWhatsAPP = req.body;
  const messageContainer = responseWhatsAPP.message.contents[1];
  if (messageContainer.type === 'text') {

    messageID.push(
      {
        id: responseWhatsAPP.message.id,
        number: messageContainer.from,
        messageType: messageContainer.type,
        messageBody:  messageContainer.text 
      }
    );
  }
  else 
  {


    let file = fs.createWriteStream(`./src/assets/audio/ogg/${messageContainer.fileName}`);
    http.get(messageContainer.fileUrl, function(response) {
      response.pipe(file);
    });

  const oggFile = `./src/assets/audio/ogg/${messageContainer.fileName}`;
  const localFilename = `./src/assets/audio/wav/${ messageContainer.fileName.replace('.ogg','.wav') }`;

  let fileID = 0;
  let jobID = 0;
  let responseJSON;

  const apiKey = 'b538cb9141648234c349f3603b904279c6ae6d23';
  const formData = {
    target_format: 'wav',
    source_file: fs.createReadStream(oggFile)
  };

  requestAPI.post({ url: 'https://sandbox.zamzar.com/v1/jobs/', formData: formData },

    async function (err, response, body) {
      if (err) {
        console.error('Unable to start conversion job', err);
      } else {
        console.log('SUCCESS! Conversion job started:', JSON.parse(body));
        responseJSON = JSON.parse(body);
        jobID = responseJSON.id

        Wait(8000)

        requestAPI.get('https://sandbox.zamzar.com/v1/jobs/' + jobID, function (err, response, body) {
          if (err) {
            return console.error('Unable to get job', err);
          } else {
            //  console.log('SUCCESS! Got job:', JSON.parse(body));

            responseJSON = JSON.parse(body)
            fileID = 13808476 //responseJSON.target_files[0].id

            console.log(fileID)

            requestAPI.get({ url: 'https://sandbox.zamzar.com/v1/files/' + fileID + '/content', followRedirect: false }, function (err, response, body) {
              if (err) {
                console.error('Unable to download file:', err);
              } else {

                const config = {
                  languageCode: 'en-US',
                  encoding: "LINEAR16",
                };
                const audio = {
                  content: fs.readFileSync(localFilename).toString('base64')
                };

                const request = {
                  config: config,
                  audio: audio,
                };


                requestAPI.post({
                  headers: {
                    'content-type': 'application/json',
                    'X-Goog-Api-Key': "AIzaSyCqn5h5GjKS-LmuC1q7cMs9GTxH1LIGapU"
                  },
                  url: 'https://speech.googleapis.com/v1p1beta1/speech:recognize',
                  body: JSON.stringify(request),
                }, (error, response, body) => {
                  const responseBody = JSON.parse(body);
                  console.log(responseBody)

                   messageID.push(
                    {
                      id: responseWhatsAPP.message.id,
                      number: messageContainer.from,
                      messageType: messageContainer.type,
                      messageBody: messageContainer.type === 'text' ? messageContainer.text : messageContainer.fileUrl
                    }
                  );

                });

              }
            }).auth(apiKey, '', true).pipe(fs.createWriteStream(localFilename));
          }
        }).auth(apiKey, '', true);

      }
    }).auth(apiKey, '', true)
}
}

);


module.exports = routes;