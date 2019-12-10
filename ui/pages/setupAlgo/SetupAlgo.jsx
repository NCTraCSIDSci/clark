import React, { useEffect } from 'react';
import Paper from '@material-ui/core/Paper';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import NativeSelect from '@material-ui/core/NativeSelect';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import shortid from 'shortid';

import './algo.css';

import DataBrowser from '../../subComponents/dataBrowser/DataBrowser';
import MetaDataBrowser from '../../subComponents/metaDataBrowser/MetaDataBrowser';

import usePatientBrowser from '../../customHooks/usePatientBrowser';

function SetupAlgo(props) {
  const {
    tab, setTab, updateSteps, regex, metaData, algo,
  } = props;
  const patients = usePatientBrowser();

  useEffect(() => {
    if (algo.loadedTestData) {
      patients.initialize('test');
      metaData.initialize('test');
    }
  }, [algo.loadedTestData]);

  function explore() {
    // const data = algo;
    // API.algoSetup();
    setTab('explore');
    updateSteps(tab);
  }

  return (
    <>
      {tab === 'algo' && (
        <div id="algoSetupContainer">
          <Paper id="algoClassifier">
            <h2>Classifier</h2>
            <FormControl>
              <InputLabel htmlFor="algo">Algorithm</InputLabel>
              <NativeSelect
                value={algo.algo}
                onChange={(e) => algo.updateAlgo(e.target.value)}
                inputProps={{ name: 'algo', id: 'algo' }}
              >
                {algo.algoOptions.map((opt) => (
                  <option key={shortid.generate()} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
          </Paper>
          <Paper id="algoTrainTest">
            <FormControl>
              <InputLabel htmlFor="evalMethod">Evaluation Method</InputLabel>
              <NativeSelect
                value={algo.evalMethod}
                onChange={(e) => algo.updateEvalMethod(e.target.value)}
                inputProps={{ name: 'evalMethod', id: 'evalMethod' }}
              >
                {algo.evalOptions.map((e) => (
                  <option key={shortid.generate()} value={e}>
                    {e}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
            {algo.evalMethod === 'Cross-Validation' ? (
              <div className="algoSelectDiv">
                <h2>Cross-Validation on Training Corpus</h2>
                <FormControl className="algoSelect">
                  <InputLabel htmlFor="crossValMethod">Cross-Validation Method</InputLabel>
                  <NativeSelect
                    value={algo.crossValMethod}
                    onChange={(e) => algo.updateCrossValMethod(e.target.value)}
                    inputProps={{ name: 'crossValMethod', id: 'crossValMethod' }}
                  >
                    {algo.crossValOptions.map((crossVal) => (
                      <option key={shortid.generate()} value={crossVal}>
                        {crossVal}
                      </option>
                    ))}
                  </NativeSelect>
                </FormControl>
                <FormControl className="algoSelect">
                  <InputLabel htmlFor="numFolds">Number of Folds</InputLabel>
                  <NativeSelect
                    value={algo.numFolds}
                    onChange={(e) => algo.updateNumFolds(e.target.value)}
                    inputProps={{ name: 'numFolds', id: 'numFolds' }}
                  >
                    {algo.foldOptions.map((foldNum) => (
                      <option key={shortid.generate()} value={foldNum}>
                        {foldNum}
                      </option>
                    ))}
                  </NativeSelect>
                </FormControl>
              </div>
            ) : (
              <div id="testCorpusData">
                {algo.loadedTestData ? (
                  <div id="testDataBrowser">
                    <Button
                      variant="contained"
                      onClick={algo.resetTestData}
                      id="resetTestDataButton"
                    >
                      Reset Test Data
                    </Button>
                    <MetaDataBrowser
                      numPatients={patients.numPatients}
                      metaData={metaData}
                      regex={regex}
                      type="test"
                      height="600px"
                    />
                    <DataBrowser
                      patients={patients}
                      w="50%"
                      h="600px"
                      regex={regex}
                      type="test"
                    />
                  </div>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => algo.loadTestData()}
                    id="loadTestDataButton"
                  >
                    {algo.loading ? (
                      <CircularProgress />
                    ) : (
                      'Load Test Data'
                    )}
                  </Button>
                )}
              </div>
            )}
          </Paper>
          <Button
            className="topRightButton"
            variant="contained"
            onClick={explore}
            disabled={!algo.loadedTestData && algo.evalMethod === 'Evaluation Corpus'}
          >
            Explore
          </Button>
        </div>
      )}
    </>
  );
}

export default SetupAlgo;
