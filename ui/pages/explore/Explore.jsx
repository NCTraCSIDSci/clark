import React from 'react';

import './explore.css';

import CrossFilter from './crossFilter/D3ManagedCrossFilter';

function Explore(props) {
  const { tab } = props;

  return (
    <>
      {tab === 'explore' && (
        <div>
          <CrossFilter
            data={{}}
          />
        </div>
      )}
    </>
  );
}

export default Explore;
