import React, { useEffect, useState } from 'react';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import { isEqual } from 'lodash';

import './explore.css';

import PatientModal from '../../subComponents/patientModal/PatientDetails';
import usePatientDetails from '../../customHooks/usePatientDetails';

import CrossFilterController from './crossFilter/crossFilterController';

/* Chart component that embeds a d3 plot but keeps the two dom elements separate. Does so by creating
   a DOM element in React, then getting that element id and passing it to D3. Data updates and performed by completely
   re-creating the SVG element for now.

   In other words, the Chart component just passes the objects it receives to the D3 drawing functions.

   brettwalenz note: There are a lot of ways to possibly do this, I chose the most abstracted but hopefully easiest way.
   I stole the idea from: http://nicolashery.com/integrating-d3js-visualizations-in-a-react-app/

   There were a lot of ideas for "integrating React and d3 the right way", by making SVG elements into React elements, but
   I would avoid those as that is overly complex and detailed.
*/
function Explore(props) {
  const {
    tab, result, buildSession, popup, algoRunning,
    explore, regex, session,
  } = props;
  const [recompute, setRecompute] = useState(true);
  const patientDetails = usePatientDetails('fhir', popup);

  function drawCharts() {
    if (!Object.keys(result).length || result.entry === undefined) {
      // our results array is empty, usually from successive calls to initializeState
      // just remove the chart, but don't render
      CrossFilterController.doRemove();
    } else {
      CrossFilterController.doRemove();
      CrossFilterController.doRender(result, patientDetails);
    }
  }

  useEffect(() => {
    if (!recompute) {
      drawCharts();
    }
  }, [recompute]);

  useEffect(() => {
    if (tab === 'explore' && !algoRunning) {
      const newSession = buildSession();
      if (!isEqual(session, newSession)) {
        setRecompute(true);
      } else if (recompute) {
        setRecompute(false);
      } else {
        drawCharts();
      }
    }
  }, [algoRunning, tab, result]);

  return (
    <>
      {tab === 'explore' && (
        <Paper id="resultsExplorer">
          {!algoRunning ? (
            <>
              {!recompute ? (
                <>
                  <div id="D3CrossFilterContainer" />
                  <PatientModal
                    type="fhir"
                    container={document.getElementById('FilteredRecords')}
                    popup={popup}
                    patientDetails={patientDetails}
                    regex={regex}
                  />
                </>
              ) : (
                <div id="recompute">
                  <Button
                    onClick={explore}
                    variant="contained"
                    id="recomputeButton"
                  >
                    Rerun Algorithm
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div id="algoRunning">
              <CircularProgress size={150} thickness={2} />
              <h1>Algorithm Running...</h1>
            </div>
          )}
        </Paper>
      )}
    </>
  );
}

export default Explore;
