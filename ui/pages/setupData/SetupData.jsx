import React from 'react';
import DataBrowser from '../../subComponents/dataBrowser/DataBrowser';

import './data.css';

function SetupData(props) {
  const { tab, data, popup } = props;

  return (
    <>
      {tab === 'data' && (
        <DataBrowser data={data.data} />
      )}
    </>
  );
}

export default SetupData;
