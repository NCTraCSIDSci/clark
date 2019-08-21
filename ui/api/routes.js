import axios from 'axios';

const config = require('../../config.json');

const url = ext => `${config.protocol}://${config.host}:${config.port}/${ext}`;

const APIs = {
  get: {
    reset: axios.get(url('reset')),
    sectionDefaults: axios.get(url('sections/get')),
    classifiersList: axios.get(url('classifiers')),
    newKeyword: index => axios.get(url(`keywords/new?index=${index}`)),
    moveKeyword: (oldIndex, newIndex) => axios.get(url(`keywords/move?index=${oldIndex}&newIndex=${newIndex}`)),
    removeKeyword: index => axios.get(url(`keywords/remove?index=${index}`)),
    newFeature: index => axios.get(url(`features/new?index=${index}`)),
    moveFeature: (oldIndex, newIndex) => axios.get(url(`features/move?index=${oldIndex}&newIndex=${newIndex}`)),
    removeFeature: index => axios.get(url(`features/remove?index=${index}`)),
    newSectionName: index => axios.get(url(`sections/names/new?index=${index}`)),
    moveSectionName: (oldIndex, newIndex) => axios.get(url(`sections/names/move?index=${oldIndex}&newIndex=${newIndex}`)),
    removeSectionName: index => axios.get(url(`sections/names/remove?index=${index}`)),
  },
  post: {
    crossValidate: postData => axios.post(url('crossValidate'), postData),
    trainClassifier: postData => axios.post(url('train'), postData),
    evaluate: postData => axios.post(url('evaluate'), postData),
    loadSession: postData => axios.post(url('session/load'), postData),
    saveSession: postData => axios.post(url('session/save'), postData),
    exportResults: postData => axios.post(url('results/export'), postData),
    loadTestCorpus: postData => axios.post(url('test_corpus/load'), postData),
    loadCorpus: postData => axios.post(url('corpus/load'), postData),
    loadFeatures: postData => axios.post(url('features/load'), postData),
    saveFeatures: postData => axios.post(url('features/save'), postData),
    loadKeywords: postData => axios.post(url('keywords/load'), postData),
    saveKeywords: postData => axios.post(url('keywords/save'), postData),
    patientNote: postData => axios.post(url('patient/note'), postData),
    editKeyword: postData => axios.post(url('keywords/edit'), postData),
    editFeature: postData => axios.post(url('features/edit'), postData),
    editSectionBreaker: postData => axios.post(url('sections/break/edit'), postData),
    editSectionName: postData => axios.post(url('sections/names/edit'), postData),
    loadSections: postData => axios.post(url('sections/load'), postData),
    saveSections: postData => axios.post(url('sections/save'), postData),
  },
};

export default APIs;
