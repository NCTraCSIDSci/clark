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
  load: (directoryPath, type) => new Promise((resolve, reject) => {
    axios.request({
      method: 'POST',
      url: url(`${type}/load`),
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
  getPatientList: (type) => new Promise((resolve, reject) => {
    axios.get(url(`${type}/patient_list`))
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        const error = errorHandling(err);
        reject(error);
      });
  }),
  getPatientDetails: (id, type) => new Promise((resolve, reject) => {
    axios.get(url(`${type}/patient/${id}`))
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        const error = errorHandling(err);
        reject(error);
      });
  }),
  getPatientNote: (patientId, noteId, type) => new Promise((resolve, reject) => {
    axios.get(url(`${type}/patient/${patientId}/note/${noteId}`))
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        const error = errorHandling(err);
        reject(error);
      });
  }),
  getLabs: (type) => new Promise((resolve, reject) => {
    axios.get(url(`${type}/labs`))
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        const error = errorHandling(err);
        reject(error);
      });
  }),
  getMeds: (type) => new Promise((resolve, reject) => {
    axios.get(url(`${type}/medications`))
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        const error = errorHandling(err);
        reject(error);
      });
  }),
  getVitals: (type) => new Promise((resolve, reject) => {
    axios.get(url(`${type}/vitals`))
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        const error = errorHandling(err);
        reject(error);
      });
  }),
  getClassifiers: () => new Promise((resolve, reject) => {
    axios.get(url('classifiers'))
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        const error = errorHandling(err);
        reject(error);
      });
  }),
  coverage: (data) => new Promise((resolve, reject) => {
    axios.request({
      method: 'POST',
      url: url('coverage'),
      data,
    })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        const error = errorHandling(err);
        reject(error);
      });
  }),
  go: (data) => new Promise((resolve, reject) => {
    axios.request({
      method: 'POST',
      url: url('go'),
      data,
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
