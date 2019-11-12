import React from 'react';
import { AutoSizer, List } from 'react-virtualized';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import 'react-virtualized/styles.css';
import './dataBrowser.css';

function noRows() {
  return (
    <div>No Patients</div>
  );
}

function DataBrowser(props) {
  const { data } = props;
  console.log('data', data);

  function rowRenderer({
    index, isScrolling, key, style,
  }) {
    if (isScrolling) {
      return (
        <div key={key} style={style} className="dataBrowserRow">
          Scrolling...
        </div>
      );
    }
    const item = data[index];
    return (
      <div style={style} key={key} className="dataBrowserRow">
        {item}
        <IconButton
          onClick={() => console.log('expand', item)}
        >
          <ExpandMoreIcon />
        </IconButton>
      </div>
    );
  }

  return (
    <div id="dataBrowser">
      <h6>Patient Ids</h6>
      <AutoSizer disableHeight>
        {({ width }) => (
          <List
            noRowsRenderer={noRows}
            rowRenderer={rowRenderer}
            width={width}
            height={500}
            rowHeight={50}
            rowCount={data.length}
          />
        )}
      </AutoSizer>
    </div>
  );
}

export default DataBrowser;
