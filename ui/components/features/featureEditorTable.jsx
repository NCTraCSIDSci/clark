import React from 'react';
import { AgGridReact } from 'ag-grid-react';

class FeatureEditorTable extends React.Component {
  constructor(props) {
    super(props);
    // patient = patientName
    this.onNameChange = this.onNameChange.bind(this);
    this.onRegexChange = this.onRegexChange.bind(this);

    this.handleRowUpdate = this.handleRowUpdate.bind(this);
    this.deleteRow = this.deleteRow.bind(this);
    this.moveRowUp = this.moveRowUp.bind(this);
    this.moveRowDown = this.moveRowDown.bind(this);
    this.insertRow = this.insertRow.bind(this);

    this.onGridReady = this.onGridReady.bind(this);
    this.resizeColumns = this.resizeColumns.bind(this);

    this.state = {
      columnDefs: [
        {field: "name", headerName: "Name", width: 75, editable: true, cellEditor: 'text', onCellValueChanged: this.onNameChange},
        {field: "rawRegex", headerName: "Reg. Exp", width: 75, editable: true, cellEditor: 'text', onCellValueChanged: this.onRegexChange, cellStyle: this.cellStyleIsValid},
        {field: "regex", headerName: "Compiled", width: 75, editable: false},
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
    };
  }

  onNameChange(e) {
    this.handleRowUpdate(e.node.childIndex, e.data);
  }

  onRegexChange(e) {
    this.handleRowUpdate(e.node.childIndex, e.data);
  }

  deleteRow() {
    const cellInfo = this.api.getFocusedCell();
    if (!cellInfo) {
      return;
    }
    const rowIdx = cellInfo.rowIndex;

    if ((rowIdx >= this.props.data.length) || (rowIdx < 0)) {
      return;
    }

    const newIdx = rowIdx;
    if (newIdx <= (this.props.data.length - 1)) {
      this.props.callbacks.removeFeature(newIdx);
      this.api.setFocusedCell(newIdx, cellInfo.column.colId, cellInfo.column.floating);
      this.api.ensureIndexVisible(newIdx);
    }
  }

  moveRowUp() {
    const cellInfo = this.api.getFocusedCell();

    if (!cellInfo) {
      return;
    }
    const rowIdx = cellInfo.rowIndex;

    let newIdx = rowIdx;
    if (rowIdx > 0) {
      newIdx = rowIdx - 1;
    }

    this.props.callbacks.moveFeature(rowIdx, newIdx);
    this.api.setFocusedCell(newIdx, cellInfo.column.colId, cellInfo.column.floating);
    this.api.ensureIndexVisible(newIdx);
  }

  moveRowDown() {
    const cellInfo = this.api.getFocusedCell();
    if (!cellInfo) {
      return;
    }
    const rowIdx = cellInfo.rowIndex;

    let newIdx = rowIdx;
    if (!(rowIdx === (this.props.data.length - 1))) {
      newIdx = rowIdx + 1;
    }

    this.props.callbacks.moveFeature(rowIdx, newIdx);

    this.api.setFocusedCell(newIdx, cellInfo.column.colId, cellInfo.column.floating);
    this.api.ensureIndexVisible(newIdx);
  }

  insertRow() {
    const cellInfo = this.api.getFocusedCell();
    let rowIdx = this.props.data.length;
    let colId = "rawRegex";
    if (cellInfo) {
      rowIdx = cellInfo.rowIndex;
      colId = cellInfo.column.colId;
    }

    const newIdx = rowIdx;

    this.props.callbacks.newFeature(newIdx);

    this.api.setFocusedCell(newIdx, colId, null);
    this.api.ensureIndexVisible(newIdx);
  }

  handleRowUpdate(rowIdx, newRow) {
    // Talk to python to get an update
    this.props.callbacks.editFeature(rowIdx, newRow);
  }

  rowStyleIsValid(params) {
    let out = {};
    if (!params.data.isValid) {
      // out = 'table-row-error';
      out = {backgroundColor: "#b41c46"};
    } else if (params.node.childIndex % 2) {
        // out = 'table-row-odd';
        out = {backgroundColor: "#525252"};
    } else {
        // out = 'table-row-even';
        out = {backgroundColor: "#383939"};
    }

    return out;
  }

  cellStyleIsValid(params) {
    let out = {};
    if (!params.data.isValid) {
      // out = 'table-row-error';
      out = {
        color: "#fff",
        border: "2px solid #d9534f",
        margin: 0,
        fontWeight: "bold",
        paddingTop: 0,
      };
    }
    return out;
  }

  resizeColumns() {
    // this.columnApi.sizeColumnsToFit();
    // this.columnApi.autoSizeAllColumns();
    this.api.sizeColumnsToFit();
  }

  onGridReady(params) {
    this.api = params.api;
    this.columnApi = params.columnApi;
  }

  render() {
    return (
      <div>
        <div className="btn-group btn-group-sm pull-right">
          <button className="btn btn-default" type="button" onClick={this.insertRow}><span className="glyphicon glyphicon-plus" /></button>
          <button className="btn btn-default" type="button" onClick={this.deleteRow}><span className="glyphicon glyphicon-remove" /></button>
          <button className="btn btn-default" type="button" onClick={this.moveRowUp}><span className="glyphicon glyphicon-arrow-up" /></button>
          <button className="btn btn-default" type="button" onClick={this.moveRowDown}><span className="glyphicon glyphicon-arrow-down" /></button>
        </div>
        <div className="row" />
        <div className="ag-fresh" style={{height: 400, width: "100%"}}>
          <AgGridReact
            onGridReady={this.onGridReady}

            showToolPanel={this.state.showToolPanel}
            quickFilterText={this.state.quickFilterText}
            icons={this.state.icons}
            columnDefs={this.state.columnDefs}
            rowData={this.props.data}

            enableColResize="true"

            getRowStyle={this.rowStyleIsValid}
            rowSelection="single"
            rowDeselection="false"
            suppressRowClickSelection="true"
            suppressMovableColumns="true"
            enableCellChangeFlash="true"
            enableSorting="false"
            enableFilter="false"
            groupHeaders="false"
            rowHeight="22"
            debug="false"
          />
        </div>
      </div>
    );
  }
}

export default FeatureEditorTable;
