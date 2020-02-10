import React, { useState, useEffect } from 'react';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Avatar from '@material-ui/core/Avatar';

import MetaDataTable from './structuredData/MetaDataTable';
import RegexTable from './regexTable/RegexTable';

/**
 * Browser containing tabs for both meta data and regex.
 * Metadata includes things like labs, meds, visits.
 * The regex tab lets the user specify specific regex that will
 * find instances of text in patient notes to provide connections
 * between patients with similar observations.
 */
function MetaDataBrowser(props) {
  const {
    type, numPatients, height, regex, metaData,
  } = props;
  const [tabIndex, setTabIndex] = useState(0);

  const editable = type !== 'test';

  useEffect(() => {
    metaData.initialize(type);
  }, [type]);

  return (
    <Paper id="tabsContainer" style={{ height }}>
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
              {editable && (
                <Avatar>
                  {`${metaData.badgeNum}`}
                </Avatar>
              )}
            </div>
          )}
        />
        <Tab
          label={(
            <div className="setupDataTab">
              Unstructured Data
              {editable && (
                <Avatar>
                  {`${regex.badgeNum}`}
                </Avatar>
              )}
            </div>
          )}
        />
      </Tabs>
      {tabIndex === 0 ? (
        <MetaDataTable
          metaData={metaData}
          numPatients={numPatients}
          editable={editable}
        />
      ) : (
        <RegexTable
          regex={regex}
          editable={editable}
          numPatients={numPatients}
        />
      )}
    </Paper>
  );
}

export default MetaDataBrowser;
