import React from 'react';

import './algo.css';

function SetupAlgo(props) {
  const { tab } = props;

  return (
    <>
      {tab === 'algo' && (
        <h1>Algo</h1>
      )}
    </>
  );
}

export default SetupAlgo;
