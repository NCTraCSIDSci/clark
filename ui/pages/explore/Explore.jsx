import React, { useEffect } from 'react';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';

import './explore.css';

import PatientModal from '../../subComponents/patientModal/PatientDetails';
import usePatientDetails from '../../customHooks/usePatientDetails';
import useRegex from '../../customHooks/useRegex';

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
    tab, result, session, popup, algoRunning,
  } = props;
  const patientDetails = usePatientDetails('fhir', popup);
  const regex = useRegex(popup);

  useEffect(() => {
    if (tab === 'explore' && !algoRunning) {
      if (!Object.keys(result).length || result.entry === undefined) {
        // our results array is empty, usually from successive calls to initializeState
        // just remove the chart, but don't render
        CrossFilterController.doRemove();
      } else {
        CrossFilterController.doRemove();
        CrossFilterController.doRender(result, patientDetails);
      }
    }
  }, [result, tab, algoRunning]);

  useEffect(() => {
    if (Object.keys(session.unstructured_data).length && tab === 'explore') {
      regex.loadRegex(session.unstructured_data);
    }
  }, [tab]);

  return (
    <>
      {tab === 'explore' && (
        <Paper id="resultsExplorer">
          {!algoRunning ? (
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
