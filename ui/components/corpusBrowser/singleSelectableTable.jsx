import React from 'react';
import { AgGridReact } from 'ag-grid-react';

const singleCellRenderer = params => `${params.value}`;

class SingleSelectableTable extends React.Component {
  constructor(props) {
    super(props);
    // patient = patientName
    this.onGridReady = this.onGridReady.bind(this);
    this.resizeColumns = this.resizeColumns.bind(this);
    this.onSelectionChanged = this.onSelectionChanged.bind(this);
    this.onNavigation = this.onNavigation.bind(this);
    this.selectRow = this.selectRow.bind(this);
    this.getColumnDefs = this.getColumnDefs.bind(this);

    this.api = null;
    this.columnApi = null;

    this.state = {
      initColumnDefs: [
        { field: "text", headerName: "Header", cellRenderer: singleCellRenderer },
      ],
      quickFilterText: null,
      showGrid: true,
      showToolPanel: false,
      icons: {
        columnRemoveFromGroup: '<i class="fa fa-remove"/>',
        filter: '<i class="fa fa-filter"/>',
        sortAscending: '<i class="fa fa-long-arrow-down"/>',
        sortDescending: '<i class="fa fa-long-arrow-up"/>',
        groupExpanded: '<i class="fa fa-minus-square-o"/>',
        groupContracted: '<i class="fa fa-plus-square-o"/>',
        columnGroupOpened: '<i class="fa fa-minus-square-o"/>',
        columnGroupClosed: '<i class="fa fa-plus-square-o"/>',
      },
      rowIndex: 0,
    };
  }

  componentDidMount() {

  }

  componentDidUpdate() {
    if (Object.prototype.hasOwnProperty.call(this.state, 'rowIndex') && (this.state.rowIndex !== null) && (this.props.data.length >= this.state.rowIndex)) {
      // console.log("selecting " + this.state.rowIndex)
      const selectedRow = this.api.getSelectedRows();
      const selectedRowIsValid = (selectedRow && selectedRow !== null && selectedRow[0] && selectedRow[0] !== null);
      if (selectedRowIsValid || this.state.rowIndex === 0) {
        // console.log("CDU - selectRow " + this.props.idField)
        this.selectRow(this.state.rowIndex);
      }
    } else {
      this.selectRow(0);
      // this.setState({rowIndex: 0});
    }

    this.resizeColumns();
  }

  onGridReady(params) {
    this.api = params.api;
    this.columnApi = params.columnApi;

    // Reset the column defs to actually be what we wanted
    this.api.setColumnDefs(this.getColumnDefs());

    this.resizeColumns();
  }

  onSelectionChanged() {
    // const selectedRow = this.api.getSelectedRows();
    const selectedNode = this.api.getSelectedNodes();
    // console.log("Attempting selection change: " + this.props.idField)
    // console.log(selectedNode);
    if ((selectedNode.length > 0) && Object.keys(selectedNode[0]).length) {
      // console.log("Have a selected node " + this.props.idField)
      if (Object.prototype.hasOwnProperty.call(selectedNode[0].data, this.props.idField)) {
        // console.log("Have a node with data" + this.props.idField)
        const rowId = selectedNode[0].data[this.props.idField];
        const rowIdx = selectedNode[0].rowIndex;

        this.setState({rowIndex: rowIdx});
        // console.log("calling table selection callback - ", this.props.idField);
        this.props.selectedRowCallback(rowId, rowIdx);
      }
    }
  }

  onNavigation(params) {
    const previousCell = params.previousCellDef;
    const suggestedNextCell = params.nextCellDef;

    const KEY_UP = 38;
    const KEY_DOWN = 40;
    const KEY_LEFT = 37;
    const KEY_RIGHT = 39;

    switch (params.key) {
      case KEY_DOWN:
        // set selected cell on current cell + 1
        this.api.forEachNode((node) => {
          if ((previousCell.rowIndex + 1) === node.rowIndex) {
            node.setSelected(true);
          }
        });
        return suggestedNextCell;
      case KEY_UP:
        // set selected cell on current cell - 1
        this.api.forEachNode((node) => {
          if ((previousCell.rowIndex - 1) === node.rowIndex) {
            node.setSelected(true);
          }
        });
        return suggestedNextCell;
      case KEY_LEFT:
      case KEY_RIGHT:
        return suggestedNextCell;
      default:
        throw Error; // this should never happen
    }
  }

  getColumnDefs() {
    return [{
      field: this.props.field,
      headerName: this.props.header,
      cellRenderer: singleCellRenderer,
    }];
  }

  resizeColumns() {
    this.api.sizeColumnsToFit();
  }


  selectRow(rowIdx) {
    this.api.forEachNode((node) => {
      if (node.rowIndex === rowIdx) {
        node.setSelected(true);
      }
    });
  }

  render() {
    return (
      <div className="ag-fresh" style={{height: "750px", width: "100%"}}>
        <AgGridReact
          onGridReady={this.onGridReady}
          navigateToNextCell={this.onNavigation}

          animateRows="true"

          showToolPanel={false}
          quickFilterText={this.state.quickFilterText}
          icons={this.state.icons}
          columnDefs={this.state.initColumnDefs}
          rowData={this.props.data}

          enableColResize="true"
          rowSelection="single"
          rowDeselection="false"
          suppressRowClickSelection="false"
          suppressMovableColumns="true"
          enableCellChangeFlash="true"
          enableSorting="true"
          enableFilter="false"
          groupHeaders="false"
          debug="false"

          onSelectionChanged={this.onSelectionChanged}
        />
      </div>
    );
  }
}

export default SingleSelectableTable;
