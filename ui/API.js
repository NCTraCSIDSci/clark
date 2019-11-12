import axios from 'axios';

const config = require('../config.json');

const url = (ext) => `${config.protocol}://${config.host}:${config.port}/${ext}`;

function errorHandling(err) {
  /* eslint-disable no-console */
  let errorText = '';
  if (err.response) {
    console.log('Error Status', err.response.status);
    console.log('Error Downloading', err.response.data);
    errorText = err.response.data;
  } else if (err.request) {
    console.log('No response was received', err.request);
    errorText = 'There was no response from the server.';
  } else {
    console.log('Unknown Error', err.message);
    errorText = err.message;
  }
  return errorText;
  /* eslint-enable no-console */
}

const API = {
  ping: () => new Promise((resolve, reject) => {
    axios.get(url('ping'))
      .then(() => {
        resolve();
      })
      .catch((err) => {
        const error = errorHandling(err);
        reject(error);
      });
  }),
  load: (directoryPath) => new Promise((resolve, reject) => {
    axios.request({
      method: 'POST',
      url: url('fhir/load'),
      data: {
        paths: directoryPath,
      },
    })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        const error = errorHandling(err);
        reject(error);
      });
  }),
};

export default API;
