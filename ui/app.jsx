import React, { useState, useEffect } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import StylesProvider from '@material-ui/styles/StylesProvider';
import CircularProgress from '@material-ui/core/CircularProgress';

import './app.css';
import 'react-virtualized/styles.css';

import AppBar from './subComponents/appBar/AppBar';
import Landing from './pages/landing/Landing';
import SetupData from './pages/setupData/SetupData';
import SetupAlgo from './pages/setupAlgo/SetupAlgo';
import Explore from './pages/explore/Explore';
import DialogPopup from './subComponents/dialogPopup/DialogPopup';

import usePopup from './customHooks/usePopup';
import useRegex from './customHooks/useRegex';
import useMetaData from './customHooks/useMetaData';
import useAlgoSetup from './customHooks/useAlgoSetup';

import loadDataFunction from './helperFunctions/dataAndSession/loadData';
import saveSessionFunction from './helperFunctions/dataAndSession/saveSession';
import loadSessionFunction from './helperFunctions/dataAndSession/loadSession';
import pingServer from './helperFunctions/pingServer';

function App() {
  const [tab, setTab] = useState('landing');
  const [serverUp, updateServer] = useState(false);
  const [stepsComplete, updateSteps] = useState([]);
  const [directory, setDirPath] = useState('');
  const [loading, setLoading] = useState(false);
  const popup = usePopup();
  const regex = useRegex();
  const metaData = useMetaData();
  const algo = useAlgoSetup();

  function updateCompletedSteps(value) {
    const tempSteps = new Set(stepsComplete);
    tempSteps.add(value);
    updateSteps([...tempSteps]);
  }

  function loadData() {
    loadDataFunction(popup, setLoading, setTab, updateCompletedSteps, setDirPath);
  }

  function loadSession() {
    loadSessionFunction(setDirPath, updateSteps, metaData, regex, algo);
  }

  function saveSession() {
    saveSessionFunction(directory, stepsComplete, metaData.exportMetaData(), regex.exportRegex(), algo.exportAlgo());
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
          stepsComplete={stepsComplete}
          saveSession={saveSession}
          disableSave={!directory}
        />
        <div id="content">
          {serverUp ? (
            <>
              <Landing
                tab={tab}
                loading={loading}
                loadData={loadData}
                loadSession={loadSession}
              />
              <SetupData
                tab={tab}
                popup={popup}
                setTab={setTab}
                updateSteps={updateCompletedSteps}
                regex={regex}
                metaData={metaData}
              />
              <SetupAlgo
                tab={tab}
                popup={popup}
                setTab={setTab}
                updateSteps={updateCompletedSteps}
                regex={regex}
                metaData={metaData}
                algo={algo}
              />
              <Explore
                tab={tab}
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
    </StylesProvider>
  );
}

export default App;
