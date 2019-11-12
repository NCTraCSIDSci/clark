import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import './landing.css';

function Landing(props) {
  const {
    tab, loadData, popup, data, setTab,
  } = props;
  const [loading, setLoading] = useState(false);

  return (
    <>
      {tab === 'landing' && (
        <div id="landingButtonContainer">
          <Button
            variant="outlined"
            onClick={() => loadData(popup, data, setLoading, setTab)}
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
            onClick={() => console.log('dont click')}
            className="blueButton"
            disabled
          >
            Load Session
          </Button>
        </div>
      )}
    </>
  );
}

export default Landing;
