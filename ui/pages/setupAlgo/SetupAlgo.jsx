import React, { useEffect } from 'react';
import Paper from '@material-ui/core/Paper';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import NativeSelect from '@material-ui/core/NativeSelect';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import shortid from 'shortid';
import { cloneDeep } from 'lodash';

import './algo.css';

import DataBrowser from '../../subComponents/dataBrowser/DataBrowser';
import MetaDataBrowser from '../../subComponents/metaDataBrowser/MetaDataBrowser';

import usePatientBrowser from '../../customHooks/usePatientBrowser';
import useAlgoSetup from '../../customHooks/useAlgoSetup';
import useRegex from '../../customHooks/useRegex';
import useMetaData from '../../customHooks/useMetaData';
import updateSessionSteps from '../../helperFunctions/updateSessionSteps';

function SetupAlgo(props) {
  const {
    tab, explore, popup, session, updateSession, serverUp,
  } = props;
  const patients = usePatientBrowser();
  const algo = useAlgoSetup(popup, serverUp);
  const regex = useRegex(popup);
  const metaData = useMetaData(popup);

  useEffect(() => {
    if (tab === 'algo' && algo.loadedTestData) {
      patients.initialize('test');
      metaData.initialize('test');
      regex.loadRegex(session.unstructured_data);
      metaData.loadMetaData(session.structured_data);
    }
  }, [tab, algo.loadedTestData]);

  useEffect(() => {
    if (Object.keys(session.algo).length) {
      algo.loadAlgo(session.algo);
    }
  }, [session]);

  function submit() {
    const tempSession = cloneDeep(session);
    const steps = updateSessionSteps(session, 'algo');
    tempSession.steps = steps;
    tempSession.algo = algo.exportAlgo();
    updateSession(tempSession);
    explore(tempSession);
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
                      popup={popup}
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
            onClick={submit}
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
