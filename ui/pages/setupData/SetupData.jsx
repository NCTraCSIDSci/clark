import React, { useEffect } from 'react';
import Button from '@material-ui/core/Button';

import './data.css';

import DataBrowser from '../../subComponents/dataBrowser/DataBrowser';
import MetaDataBrowser from '../../subComponents/metaDataBrowser/MetaDataBrowser';

function SetupData(props) {
  const {
    tab, setSteps, setTab, popup,
    patients, regex, metaData,
  } = props;

  useEffect(() => {
    if (tab === 'data') {
      patients.initialize('fhir');
      metaData.initialize('fhir');
    }
  }, [tab]);

  function submit() {
    setTab('algo');
    setSteps('data');
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
          <div className="bottomContinueButton">
            <Button
              className="continueButton"
              onClick={submit}
              variant="contained"
              disabled={!metaData.badgeNum && !regex.badgeNum}
            >
              Continue
            </Button>

          </div>
        </div>
      )}
    </>
  );
}

export default SetupData;
