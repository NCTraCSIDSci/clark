import React, { useState } from 'react';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import './landing.css';

import loadData from '../../helperFunctions/loadData';

function Landing(props) {
  const {
    tab, popup, updateSteps, setTab,
  } = props;
  const [loading, setLoading] = useState(false);

  return (
    <>
      {tab === 'landing' && (
        <Paper id="landingContainer">
          <h1 id="landingTitle">Welcome to Clark/Tracs</h1>
          <h1 id="landingSubTitle">Medical Record Predictor</h1>
          <h2 id="landingDescription">Please upload FHIR data or a previous session file to get started</h2>
          <div id="landingButtons">
            <Button
              variant="outlined"
              onClick={() => loadData(popup, setLoading, setTab, updateSteps)}
              className="blueButton"
            >
              {!loading ? (
                'Load Data'
              ) : (
                <CircularProgress />
              )}
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.alert('Sorry. We currently don\'t support sessions.')}
              className="blueButton"
              disabled
            >
              Load Session
            </Button>
          </div>
        </Paper>
      )}
    </>
  );
}

export default Landing;
