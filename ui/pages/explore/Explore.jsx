import React from 'react';
import Button from '@material-ui/core/Button';

import './explore.css';

import CrossFilter from './crossFilter/D3ManagedCrossFilter';

function Explore(props) {
  const {
    tab, result, modified, explore,
  } = props;

  return (
    <>
      {tab === 'explore' && (
        <div>
          {!modified ? (
            <CrossFilter
              data={result}
            />
          ) : (
            <Button
              variant="contained"
              onClick={explore}
            >
              Recompute Results
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export default Explore;
