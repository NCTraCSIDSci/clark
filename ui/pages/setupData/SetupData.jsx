import React, { useEffect } from 'react';
import { cloneDeep } from 'lodash';
import Button from '@material-ui/core/Button';

import './data.css';

import usePatientBrowser from '../../customHooks/usePatientBrowser';
import useRegex from '../../customHooks/useRegex';
import useMetaData from '../../customHooks/useMetaData';
import updateSessionSteps from '../../helperFunctions/updateSessionSteps';

import DataBrowser from '../../subComponents/dataBrowser/DataBrowser';
import MetaDataBrowser from '../../subComponents/metaDataBrowser/MetaDataBrowser';

function SetupData(props) {
  const {
    tab, setTab, popup, session, updateSession,
  } = props;
  const regex = useRegex(popup);
  const metaData = useMetaData(popup);
  const patients = usePatientBrowser();

  useEffect(() => {
    if (tab === 'data') {
      patients.initialize('fhir');
    }
  }, [tab]);

  useEffect(() => {
    if (
      Object.keys(session.unstructured_data).length &&
      Object.keys(session.structured_data).length
    ) {
      regex.loadRegex(session.unstructured_data);
      metaData.loadMetaData(session.structured_data);
    }
  }, [session]);

  function submit() {
    const tempSession = cloneDeep(session);
    const steps = updateSessionSteps(session, 'data');
    tempSession.steps = steps;
    tempSession.structured_data = metaData.exportMetaData();
    tempSession.unstructured_data = regex.exportRegex();
    setTab('algo');
    updateSession(tempSession);
  }

  return (
    <>
      {tab === 'data' && (
        <div id="setupDataContainer">
          <MetaDataBrowser
            metaData={metaData}
            regex={regex}
            numPatients={patients.numPatients}
            type="fhir"
            height="100%"
          />
          <DataBrowser
            patients={patients}
            w="50%"
            h="100%"
            regex={regex}
            type="fhir"
            popup={popup}
          />
          <Button
            onClick={submit}
            className="topRightButton"
            variant="contained"
            disabled={!metaData.badgeNum && !regex.badgeNum}
          >
            Continue
          </Button>
        </div>
      )}
    </>
  );
}

export default SetupData;
