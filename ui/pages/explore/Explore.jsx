import React from 'react';

import './explore.css';

function Explore(props) {
  const { tab } = props;

  return (
    <>
      {tab === 'explore' && (
        <h1>Explore</h1>
      )}
    </>
  );
}

export default Explore;
