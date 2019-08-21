import React from 'react';
import { AgGridReact } from 'ag-grid-react';

class SectionBreakEditor extends React.Component {
  constructor(props) {
    super(props);
    // callbacks={this.props.callbacks}
    // data={this.props.sectionBreakData}


    this.onRegexChange = this.onRegexChange.bind(this);

    this.onGridReady = this.onGridReady.bind(this);
    this.resizeColumns = this.resizeColumns.bind(this);

    this.state = {
      columnDefs: [
        {field: "regex", headerName: "Section Break Regex", width: 75, editable: true, cellEditor: 'text', onCellValueChanged: this.onRegexChange},
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

  onRegexChange(e) {
    this.props.callbacks.editSectionBreaker(e.data);
  }

  onGridReady(params) {
    this.api = params.api;
    this.columnApi = params.columnApi;
    this.resizeColumns();
  }

  resizeColumns() {
    // this.columnApi.sizeColumnsToFit();
    // this.columnApi.autoSizeAllColumns();
    this.api.sizeColumnsToFit();
  }

  render() {
    return (
      <div className="ag-fresh" style={{height: 65, width: "100%", paddingBottom: "5px"}}>
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
    );
  }
}

export default SectionBreakEditor;
