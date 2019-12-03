import React from 'react';
import Paper from '@material-ui/core/Paper';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import NativeSelect from '@material-ui/core/NativeSelect';
import Button from '@material-ui/core/Button';

import './algo.css';
// import API from '../../API';

import useAlgoSetup from '../../customHooks/useAlgoSetup';

function SetupAlgo(props) {
  const { tab, setTab, updateSteps } = props;
  const algo = useAlgoSetup();

  function explore() {
    // const data = algo;
    // API.algoSetup();
    setTab('explore');
    updateSteps('algo');
  }

  return (
    <>
      {tab === 'algo' && (
        <Paper id="algoSetup">
          <h2>Configure a Classifier and Evaluation Method</h2>
          <div className="algoSelectDiv">
            <FormControl className="algoSelect">
              <InputLabel htmlFor="algo">Algorithm</InputLabel>
              <NativeSelect
                value={algo.algo}
                onChange={(e) => algo.updateAlgo(e.target.value)}
                inputProps={{ name: 'algo', id: 'algo' }}
              >
                <option value="linear SVM">Linear SVM</option>
                <option value="gaussian naive bayes">Gaussian Naive Bayes</option>
                <option value="decision tree">Decision Tree</option>
                <option value="random forest">Random Forest</option>
              </NativeSelect>
            </FormControl>
            <FormControl className="algoSelect">
              <InputLabel htmlFor="evalMethod">Evaluation Method</InputLabel>
              <NativeSelect
                value={algo.evalMethod}
                onChange={(e) => algo.updateEvalMethod(e.target.value)}
                inputProps={{ name: 'evalMethod', id: 'evalMethod' }}
              >
                <option value="cross-validation">Cross-Validation</option>
                <option value="evaluation corpus">Evaluation Corpus</option>
              </NativeSelect>
            </FormControl>
          </div>
          <h2>Cross-Validation on Training Corpus</h2>
          <div className="algoSelectDiv">
            <FormControl className="algoSelect">
              <InputLabel htmlFor="crossValMethod">Cross-Validation Method</InputLabel>
              <NativeSelect
                value={algo.crossValMethod}
                onChange={(e) => algo.updateCrossValMethod(e.target.value)}
                inputProps={{ name: 'crossValMethod', id: 'crossValMethod' }}
              >
                <option value="stratified">Stratified</option>
                <option value="random">Random</option>
              </NativeSelect>
            </FormControl>
            <FormControl className="algoSelect">
              <InputLabel htmlFor="numFolds">Number of Folds</InputLabel>
              <NativeSelect
                value={algo.numFolds}
                onChange={(e) => algo.updateNumFolds(e.target.value)}
                inputProps={{ name: 'numFolds', id: 'numFolds' }}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </NativeSelect>
            </FormControl>
          </div>
          <div id="algoExploreButton">
            <Button
              variant="contained"
              onClick={explore}
            >
              Explore
            </Button>
          </div>
        </Paper>
      )}
    </>
  );
}

export default SetupAlgo;
