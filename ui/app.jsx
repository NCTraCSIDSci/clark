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

import pingServer from './helperFunctions/pingServer';

function App() {
  const [tab, setTab] = useState('landing');
  const [serverUp, updateServer] = useState(false);
  const [stepsComplete, updateSteps] = useState([]);
  const popup = usePopup();

  function updateCompletedSteps(value) {
    stepsComplete.push(value);
    updateSteps([...stepsComplete]);
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
        />
        <div id="content">
          {serverUp ? (
            <>
              <Landing
                tab={tab}
                popup={popup}
                setTab={setTab}
                updateSteps={updateCompletedSteps}
              />
              <SetupData
                tab={tab}
                popup={popup}
              />
              <SetupAlgo
                tab={tab}
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
