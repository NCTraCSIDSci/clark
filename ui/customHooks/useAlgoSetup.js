import { useState } from 'react';
import API from '../API';

import getDirPath from '../helperFunctions/dataAndSession/getDirPath';

const algoOptions = [
  'Linear SVM', 'Gaussian Naive Bayes',
  'Decision Tree', 'Random Tree',
];

const evalOptions = [
  'Cross-Validation', 'Evaluation Corpus',
];

const crossValOptions = ['Stratified', 'Random'];

const foldOptions = [2, 3, 5, 10, 25];

function useAlgoSetup() {
  const [algo, updateAlgo] = useState('Linear SVM');
  const [evalMethod, updateEvalMethod] = useState('Cross-Validation');
  const [crossValMethod, updateCrossValMethod] = useState('Stratified');
  const [numFolds, updateNumFolds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loadedTestData, setLoadedTestData] = useState(false);
  const [dirPath, setDirPath] = useState('');

  function loadTestData(path) {
    const filePath = path || getDirPath();
    if (filePath) {
      setLoading(true);
      API.load([filePath], 'test')
        .then(() => {
          setLoading(false);
          setLoadedTestData(true);
          setDirPath(filePath);
        })
        .catch((err) => {
          setLoading(false);
          console.log('failed to upload test data', err);
        });
    }
  }

  function resetTestData() {
    setLoadedTestData(false);
  }

  function loadAlgo(obj) {
    updateAlgo(obj.algoType);
    updateEvalMethod(obj.evalMethod);
    updateCrossValMethod(obj.crossValMethod);
    updateNumFolds(obj.numFolds);
    setDirPath(obj.testDataDirectory);
    if (obj.testDataDirectory) {
      loadTestData(obj.testDataDirectory);
    }
  }

  const completeAlgo = {
    algoType: algo,
    evalMethod,
    crossValMethod,
    numFolds,
    testDataDirectory: dirPath,
  };

  return {
    completeAlgo,
    loadAlgo,
    algo,
    algoOptions,
    updateAlgo,
    evalMethod,
    evalOptions,
    updateEvalMethod,
    crossValMethod,
    crossValOptions,
    updateCrossValMethod,
    numFolds,
    foldOptions,
    updateNumFolds,
    loadTestData,
    loading,
    loadedTestData,
    resetTestData,
  };
}

export default useAlgoSetup;
