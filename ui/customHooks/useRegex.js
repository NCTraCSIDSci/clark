import { useState, useEffect } from 'react';
import { cloneDeep } from 'lodash';

const initialRegex = {
  library: [
    {
      name: 'Test',
      regex: '/_/g',
    },
    {
      name: 'Foo',
      regex: '/bird/g',
    },
  ],
  expressions: [],
  sections: [],
};

function useRegex() {
  const [regex, setRegex] = useState(initialRegex);
  const [tab, setTab] = useState(Object.keys(initialRegex)[0]);
  const [gridApi, setGridApi] = useState(null);
  const [columnApi, setColumnApi] = useState(null);

  function handleRegexChange(params) {
    const tempRegex = cloneDeep(regex);
    tempRegex[tab][params.node.childIndex] = params.data;
    setRegex(tempRegex);
  }

  function removeRow() {
    const cell = gridApi.getFocusedCell();
    if (cell) {
      const tempRegex = cloneDeep(regex);
      tempRegex[tab].splice(cell.rowIndex, 1);
      setRegex(tempRegex);
    }
  }

  function rowDrag(event) {
    const { overNode, node: movingNode } = event;
    const rowNeedsToMove = movingNode !== overNode;
    if (rowNeedsToMove) {
      const movingData = movingNode.data;
      const overData = overNode.data;
      const fromIndex = regex[tab].indexOf(movingData);
      const toIndex = regex[tab].indexOf(overData);
      const tempRegex = cloneDeep(regex);
      const element = tempRegex[tab][fromIndex];
      tempRegex[tab].splice(fromIndex, 1);
      tempRegex[tab].splice(toIndex, 0, element); // swap nodes
      setRegex(tempRegex);
      gridApi.clearFocusedCell();
    }
  }

  const columnData = {
    library: [
      {
        field: 'name',
        headerName: 'Name',
        editable: true,
        onCellValueChanged: handleRegexChange,
        rowDrag: true,
      },
      {
        field: 'regex',
        headerName: 'Reg. Exp',
        editable: true,
        onCellValueChanged: handleRegexChange,
      },
    ],
    expressions: [
      {
        field: 'name',
        headerName: 'Name',
        editable: true,
        onCellValueChanged: handleRegexChange,
        rowDrag: true,
      },
      {
        field: 'rawRegex',
        headerName: 'Reg. Exp',
        editable: true,
        onCellValueChanged: handleRegexChange,
      },
      {
        field: 'regex',
        headerName: 'Compiled',
        editable: false,
      },
    ],
    sections: [
      {
        field: 'name',
        headerName: 'Name',
        rowDrag: true,
      },
      {
        field: 'regex',
        headerName: 'Reg. Exp',
      },
      {
        field: 'inuse',
        headerName: 'In Use',
      },
    ],
  };

  function addRow() {
    if (regex[tab].find((row) => row.name === '')) {
      return;
    }
    const tempRegex = cloneDeep(regex);
    const keys = columnData[tab].map((col) => col.field);
    console.log('keys', keys);
    const newRow = {};
    keys.forEach((key) => {
      newRow[key] = '';
    });
    console.log('new row', newRow);
    tempRegex[tab].push(newRow);
    setRegex(tempRegex);
  }

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
      gridApi.setRowData(regex[tab]);
    }
  }, [tab, gridApi]);

  useEffect(() => {
    if (gridApi) {
      console.log(regex);
      gridApi.setRowData(regex[tab]);
    }
  }, [regex]);

  function getRowNodeId(data) {
    console.log('data', data);
    return data.name;
  }

  return {
    tabs: Object.keys(initialRegex),
    tab,
    setTab,
    columnData: columnData[tab],
    // rowData: regex[tab],
    getRowNodeId,
    addRow,
    removeRow,
    rowDrag,
    setGridApi,
    setColumnApi,
  };
}

export default useRegex;
