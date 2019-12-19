import React, { useState, useEffect } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import StylesProvider from '@material-ui/styles/StylesProvider';
import CircularProgress from '@material-ui/core/CircularProgress';

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


import loadDataFunction from './helperFunctions/dataAndSession/loadData';
import saveSessionFunction from './helperFunctions/dataAndSession/saveSession';
import loadSessionFunction from './helperFunctions/dataAndSession/loadSession';
import pingServer from './helperFunctions/pingServer';
import buildData from './helperFunctions/buildData';

const initialSession = {
  fhir_directory: '',
  structured_data: {},
  unstructured_data: {},
  algo: {},
  steps: [],
};

function App() {
  const [tab, setTab] = useState('landing');
  const [serverUp, updateServer] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [result, setResult] = useState({});
  const [session, updateSession] = useState(initialSession);
  const popup = usePopup();

  function loadData() {
    loadDataFunction(
      popup, setDataLoading, setTab,
      updateSession,
    );
  }

  function loadSession() {
    loadSessionFunction(
      setTab, popup,
      setSessionLoading, updateSession,
    );
  }

  function saveSession() {
    saveSessionFunction(
      popup, session,
    );
  }

  function explore(completeSession) {
    const data = buildData(completeSession);
    console.log(data);
    API.go(data)
      .then((res) => {
        console.log('go result', res);
        setTab('explore');
        setResult(res);
      })
      .catch((err) => {
        // TODO: show the error modal
        console.log('err', err);
        setResult({});
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
          session={session}
          saveSession={saveSession}
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
                setTab={setTab}
                popup={popup}
                session={session}
                updateSession={updateSession}
              />
              <SetupAlgo
                tab={tab}
                explore={explore}
                popup={popup}
                session={session}
                updateSession={updateSession}
                serverUp={serverUp}
              />
              <Explore
                tab={tab}
                result={result}
                explore={explore}
                session={session}
                popup={popup}
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
