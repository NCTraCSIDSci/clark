import { useState } from 'react';

function useAlgoSetup() {
  const [algo, updateAlgo] = useState('linear SVM');
  const [evalMethod, updateEvalMethod] = useState('cross-validation');
  const [crossValMethod, updateCrossValMethod] = useState('stratified');
  const [numFolds, updateNumFolds] = useState(5);

  return {
    algo,
    updateAlgo,
    evalMethod,
    updateEvalMethod,
    crossValMethod,
    updateCrossValMethod,
    numFolds,
    updateNumFolds,
  };
}

export default useAlgoSetup;
