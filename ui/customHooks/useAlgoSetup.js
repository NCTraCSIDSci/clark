import { useState, useEffect } from 'react';
import API from '../API';

import getDirPath from '../helperFunctions/dataAndSession/getDirPath';

const defaultAlgoOptions = [
  { id: 'LinearSVM', name: 'Linear SVM' },
  { id: 'GaussianNB', name: 'Gaussian Naive Bayes' },
  { id: 'DecisionTree', name: 'Decision Tree' },
  { id: 'RandomForest', name: 'Random Forest' },
];

const evalOptions = [
  'Cross-Validation', 'Evaluation Corpus',
];

const crossValOptions = ['Stratified', 'Random'];

const foldOptions = [2, 3, 5, 10, 25];

function useAlgoSetup(popup, serverUp) {
  const [algo, updateAlgo] = useState(defaultAlgoOptions[0].name);
  const [evalMethod, updateEvalMethod] = useState('Cross-Validation');
  const [crossValMethod, updateCrossValMethod] = useState('Stratified');
  const [numFolds, updateNumFolds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loadedTestData, setLoadedTestData] = useState(false);
  const [dirPath, setDirPath] = useState('');
  const [algoOptions, setAlgoOptions] = useState(defaultAlgoOptions);

  useEffect(() => {
    if (serverUp) {
      API.getClassifiers()
        .then((res) => {
          setAlgoOptions(res);
        })
        .catch(() => {
          popup.showSnackbar({
            text: 'Error getting classifiers.',
            type: 'error',
          });
        });
    }
  }, [serverUp]);

  function loadTestData(path) {
    const filePath = path || getDirPath();
    if (filePath) {
      setLoading(true);
      API.load([filePath], 'test')
        .then(() => {
          setLoading(false);
          setLoadedTestData(true);
          setDirPath(filePath);
          popup.showSnackbar({
            text: 'Successfully loaded test data.',
            type: 'success',
          });
        })
        .catch((err) => {
          setLoading(false);
          popup.showModal({
            disableBackdrop: false,
            error: true,
            header: 'Error Uploading Data',
            text: err,
            actions: [{
              text: 'Close',
              autoFocus: true,
              click: () => popup.toggle(false),
            }],
          });
        });
    }
  }

  function resetTestData() {
    setLoadedTestData(false);
  }

  function loadAlgo(obj) {
    updateAlgo(obj.algo_type);
    updateEvalMethod(obj.eval_method.type);
    if (obj.eval_method.type === 'Evaluation Corpus') {
      setDirPath(obj.eval_method.test_data_directory);
      loadTestData(obj.eval_method.test_data_directory);
    } else {
      updateCrossValMethod(obj.eval_method.crossval_method);
      updateNumFolds(obj.eval_method.num_folds);
    }
  }

  function exportAlgo() {
    const completeAlgo = {
      algo_type: algo,
      eval_method: {
        type: evalMethod,
      },
    };
    if (evalMethod === 'Cross-Validation') {
      completeAlgo.eval_method.crossval_method = crossValMethod;
      completeAlgo.eval_method.num_folds = Number(numFolds);
    } else {
      completeAlgo.eval_method.test_data_directory = dirPath;
    }
    return completeAlgo;
  }

  function resetAlgo() {
    setLoadedTestData(false);
    setDirPath('');
    updateEvalMethod('Cross-Validation');
  }

  return {
    exportAlgo,
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
    resetAlgo,
    dirPath,
  };
}

export default useAlgoSetup;
