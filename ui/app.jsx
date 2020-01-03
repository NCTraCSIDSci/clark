import React, { useState, useEffect } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import StylesProvider from '@material-ui/styles/StylesProvider';
import CircularProgress from '@material-ui/core/CircularProgress';
import { cloneDeep } from 'lodash';

import './app.css';
import 'react-virtualized/styles.css';

import API from './API';

import AppBar from './subComponents/appBar/AppBar';
import Landing from './pages/landing/Landing';
import SetupData from './pages/setupData/SetupData';
import SetupAlgo from './pages/setupAlgo/SetupAlgo';
import Explore from './pages/explore/Explore';
import DialogPopup from './subComponents/dialogPopup/DialogPopup';
import SnackbarPopup from './subComponents/snackbarPopup/SnackbarPopup';

import usePopup from './customHooks/usePopup';
import usePatientBrowser from './customHooks/usePatientBrowser';
import useMetaData from './customHooks/useMetaData';
import useRegex from './customHooks/useRegex';
import useAlgo from './customHooks/useAlgoSetup';

import loadDataFunction from './helperFunctions/dataAndSession/loadData';
import saveSessionFunction from './helperFunctions/dataAndSession/saveSession';
import loadSessionFunction from './helperFunctions/dataAndSession/loadSession';
import pingServer from './helperFunctions/pingServer';
import buildData from './helperFunctions/buildData';
import updateSessionSteps from './helperFunctions/updateSessionSteps';

const initialSession = {
  fhir_directory: '',
  steps: [],
};

function App() {
  const [tab, setTab] = useState('landing');
  const [serverUp, updateServer] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [algoRunning, setAlgoRunning] = useState(false);
  const [result, setResult] = useState({});
  const [session, updateSession] = useState(initialSession);
  const [steps, updateSteps] = useState([]);
  const popup = usePopup();
  const patients = usePatientBrowser();
  const metaData = useMetaData(popup);
  const regex = useRegex(popup);
  const algo = useAlgo(popup, serverUp);

  function setSteps(value) {
    if (Array.isArray(value)) {
      updateSteps(updateSessionSteps(steps, value));
    } else {
      updateSteps(updateSessionSteps(steps, [value]));
    }
  }

  function resetState() {
    metaData.resetMetaData();
    regex.resetRegex();
    algo.resetAlgo();
    updateSteps(['landing']);
  }

  function loadData() {
    loadDataFunction(
      popup, setDataLoading, setTab,
      patients.setFhirDirectory, resetState,
    );
  }

  function loadSession() {
    loadSessionFunction(
      setTab, popup,
      setSessionLoading, updateSession,
      patients.setFhirDirectory,
      setSteps, algo.loadAlgo,
      metaData.loadMetaData, regex.loadRegex,
    );
  }

  function buildSession() {
    const tempSession = cloneDeep(session);
    tempSession.fhir_directory = patients.fhirDir;
    tempSession.structured_data = metaData.exportMetaData();
    tempSession.unstructured_data = regex.exportRegex();
    tempSession.algo = algo.exportAlgo();
    const index = steps.indexOf('algo');
    const tempSteps = [...steps];
    if (index > -1) {
      tempSteps.splice(index, 1); // remove algo from steps so a new session has to run the algo again
    }
    tempSession.steps = tempSteps;
    return tempSession;
  }

  function saveSession() {
    const tempSession = buildSession();
    saveSessionFunction(
      popup, tempSession,
    );
  }

  function explore() {
    setAlgoRunning(true);
    setTab('explore');
    const newSession = buildSession();
    const data = buildData(newSession);
    updateSession(newSession);
    API.go(data)
      .then((res) => {
        setSteps('algo');
        setResult(res);
        setAlgoRunning(false);
      })
      .catch((err) => {
        popup.showModal({
          disableBackdrop: true,
          error: true,
          header: 'Error',
          text: err,
          actions: [{
            text: 'Close',
            autoFocus: false,
            click: () => popup.toggle(false),
          }],
        });
        setTab('algo');
        setResult({});
        setAlgoRunning(false);
      });
  }

  useEffect(() => {
    pingServer(popup, updateServer);
  }, []);

  return (
    <StylesProvider injectFirst>
      <CssBaseline />
      <div id="mainContainer">
        <AppBar
          tab={tab}
          setTab={setTab}
          popup={popup}
          fhirDir={patients.fhirDir}
          steps={steps}
          saveSession={saveSession}
          algoRunning={algoRunning}
        />
        <div id="content">
          {serverUp ? (
            <>
              <Landing
                tab={tab}
                dataLoading={dataLoading}
                sessionLoading={sessionLoading}
                loadData={loadData}
                loadSession={loadSession}
              />
              <SetupData
                tab={tab}
                setSteps={setSteps}
                setTab={setTab}
                popup={popup}
                patients={patients}
                metaData={metaData}
                regex={regex}
              />
              <SetupAlgo
                tab={tab}
                explore={explore}
                popup={popup}
                patients={patients}
                metaData={metaData}
                regex={regex}
                algo={algo}
              />
              <Explore
                tab={tab}
                algoRunning={algoRunning}
                result={result}
                explore={explore}
                session={session}
                buildSession={buildSession}
                popup={popup}
                regex={regex}
              />
            </>
          ) : (
            <>
              <CircularProgress size={150} thickness={2} />
              <h1>Loading...</h1>
            </>
          )}
        </div>
      </div>
      <DialogPopup popup={popup} />
      <SnackbarPopup popup={popup} />
    </StylesProvider>
  );
}

export default App;
