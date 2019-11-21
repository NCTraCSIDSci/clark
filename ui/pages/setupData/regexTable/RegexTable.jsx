import React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Button from '@material-ui/core/Button';
import shortid from 'shortid';
import { AgGridReact } from '@ag-grid-community/react';
import { AllCommunityModules } from '@ag-grid-community/all-modules';

import './regexTable.css';
import '@ag-grid-community/all-modules/dist/styles/ag-grid.css';
import '@ag-grid-community/all-modules/dist/styles/ag-theme-material.css';

import prettyString from '../../../helperFunctions/prettyString';

function RegexTable(props) {
  const { regex } = props;

  function gridReady(params) {
    regex.setGridApi(params.api);
    regex.setColumnApi(params.columnApi);
  }

  return (
    <div id="setupDataLeftTable">
      <div id="setupDataLeftTab">
        <List>
          {regex.tabs.map((tab) => (
            <ListItem
              key={shortid.generate()}
              button
              onClick={() => regex.setTab(tab)}
              className={regex.tab === tab ? 'activeMetaDataTab' : ''}
            >
              <ListItemText primary={prettyString(tab)} />
            </ListItem>
          ))}
        </List>
      </div>
      <div id="setupDataLeftContainer">
        <div id="setupDataSortBar">
          <Button
            onClick={regex.addRow}
          >
            Add
          </Button>
          <Button
            onClick={regex.removeRow}
          >
            Remove
          </Button>
        </div>
        <div id="setupDataList" className="ag-theme-material">
          <AgGridReact
            columnDefs={regex.columnData}
            // rowData={regex.rowData}
            modules={AllCommunityModules}
            onGridReady={gridReady}
            suppressMovableColumns
            stopEditingWhenGridLosesFocus
            deltaRowDataMode
            getRowNodeId={regex.getRowNodeId}
            onRowDragMove={regex.rowDrag}
          />
        </div>
      </div>
    </div>
  );
}

export default RegexTable;
