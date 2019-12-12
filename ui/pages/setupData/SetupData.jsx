import React, { useEffect } from 'react';
import Button from '@material-ui/core/Button';

import './data.css';

import usePatientBrowser from '../../customHooks/usePatientBrowser';

import DataBrowser from '../../subComponents/dataBrowser/DataBrowser';
import MetaDataBrowser from '../../subComponents/metaDataBrowser/MetaDataBrowser';

function SetupData(props) {
  const {
    tab, setTab, updateSteps, regex, metaData, popup,
  } = props;
  const patients = usePatientBrowser();

  const metaDataBadgeNum = metaData.badgeNum;

  const notesBadgeNum = regex.badgeNum;

  useEffect(() => {
    if (tab === 'data') {
      patients.initialize('fhir');
      metaData.initialize('fhir');
    }
  }, [tab]);

  function submitFeatures() {
    setTab('algo');
    updateSteps(tab);
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
            regex={{
              validRegex: regex.validRegex,
              tab: regex.tab,
              sectionBreak: regex.sectionBreak,
              ignoreHeader: regex.ignoreHeader,
              ignoreUnnamed: regex.ignoreUnnamed,
            }}
            type="fhir"
            popup={popup}
          />
          <Button
            onClick={submitFeatures}
            className="topRightButton"
            variant="contained"
            disabled={!metaDataBadgeNum && !notesBadgeNum}
          >
            Continue
          </Button>
        </div>
      )}
    </>
  );
}

export default SetupData;
