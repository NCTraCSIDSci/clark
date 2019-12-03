import React, { useState, useEffect } from 'react';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';

import './data.css';

// import API from '../../API';

import usePatientBrowser from '../../customHooks/usePatientBrowser';
import useMetaData from '../../customHooks/useMetaData';
import useRegex from '../../customHooks/useRegex';

import DataBrowser from '../../subComponents/dataBrowser/DataBrowser';
import MetaDataTable from './metaDataTable/MetaDataTable';
import RegexTable from './regexTable/RegexTable';

function SetupData(props) {
  const { tab, setTab, updateSteps } = props;
  const [tabIndex, setTabIndex] = useState(0);
  const patients = usePatientBrowser();
  const metaData = useMetaData();
  const regex = useRegex();

  const metaDataBadgeNum = metaData.badgeNum;

  const notesBadgeNum = regex.badgeNum;

  useEffect(() => {
    if (tab === 'data') {
      patients.initialize();
      metaData.initialize();
    }
  }, [tab]);

  function submitFeatures() {
    // const data = combineAllData(metaData, regex);
    // API.submitFeatures();
    setTab('algo');
    updateSteps('setupData');
  }

  return (
    <>
      {tab === 'data' && (
        <div id="setupDataContainer">
          <Paper id="tabsContainer">
            <Tabs
              value={tabIndex}
              onChange={(e, i) => setTabIndex(i)}
              variant="fullWidth"
              indicatorColor="primary"
            >
              <Tab
                label={(
                  <div className="setupDataTab">
                    Structured Data
                    <Avatar>
                      {`${metaDataBadgeNum}`}
                    </Avatar>
                  </div>
                )}
              />
              <Tab
                label={(
                  <div className="setupDataTab">
                    Notes
                    <Avatar>
                      {`${notesBadgeNum}`}
                    </Avatar>
                  </div>
                )}
              />
            </Tabs>
            {tabIndex === 0 ? (
              <MetaDataTable
                metaData={metaData}
                numPatients={patients.numPatients}
              />
            ) : (
              <RegexTable
                regex={regex}
              />
            )}
          </Paper>
          <DataBrowser
            patients={patients}
            w="50%"
            h="100%"
            regex={{
              validRegex: regex.validRegex,
              tab: regex.tab,
              sectionBreak: regex.sectionBreak,
            }}
          />
          <Button
            onClick={submitFeatures}
            className="topRightButton"
            variant="contained"
          >
            Continue
          </Button>
        </div>
      )}
    </>
  );
}

export default SetupData;
