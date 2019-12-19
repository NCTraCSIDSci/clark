import React from 'react';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';

import './explore.css';

import CrossFilter from './crossFilter/D3ManagedCrossFilter';
import PatientModal from '../../subComponents/patientModal/PatientDetails';
import usePatientDetails from '../../customHooks/usePatientDetails';

function Explore(props) {
  const {
    tab, result, explore, session, popup,
  } = props;
  const patientDetails = usePatientDetails('fhir', popup);

  return (
    <>
      {tab === 'explore' && (
        <Paper id="resultsExplorer">
          {/* {!modified ? ( */}
          <CrossFilter
            data={result}
            patientDetails={patientDetails}
          />
          <PatientModal
            type="fhir"
            container={document.getElementById('resultsExplorer')}
            popup={popup}
            patientDetails={patientDetails}
            regex={{}}
          />
          {/* ) : (
            <Button
              variant="contained"
              onClick={explore}
            >
              Recompute Results
            </Button>
          )} */}
        </Paper>
      )}
    </>
  );
}

export default Explore;
