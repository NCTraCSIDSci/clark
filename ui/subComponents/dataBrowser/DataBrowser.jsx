import React from 'react';
import { AutoSizer, Column, Table } from 'react-virtualized';
import Paper from '@material-ui/core/Paper';
import TableCell from '@material-ui/core/TableCell';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TextField from '@material-ui/core/TextField';

import './dataBrowser.css';

import usePatientDetails from '../../customHooks/usePatientDetails';
import PatientDetails from './patientModal/PatientDetails';

function DataBrowser(props) {
  const { patients, w, h } = props;
  const patientDetails = usePatientDetails();

  function headerRenderer({
    dataKey, disableSort, sortBy, sortDirection, label,
  }) {
    return (
      <TableCell
        component="div"
        variant="head"
        padding="none"
        className="browserHeaderCell"
      >
        {disableSort ? (
          <>
            {label}
            <TextField
              onChange={(event) => patients.updateFilter(dataKey, event.target.value)}
              margin="none"
              className="searchTextField"
              inputProps={{ style: { padding: '3px 0px' } }}
            />
          </>
        ) : (
          <TableSortLabel
            active={sortBy === dataKey}
            direction={sortDirection ? sortDirection.toLowerCase() : 'asc'}
            hideSortIcon={sortDirection && sortBy !== dataKey}
          >
            {label}
          </TableSortLabel>
        )}
      </TableCell>
    );
  }

  function cellRenderer({ cellData }) {
    return (
      <TableCell
        component="div"
        variant="body"
        padding="none"
      >
        {cellData}
      </TableCell>
    );
  }

  function getRowClass({ index }) {
    if (index === -1) {
      return 'browserHeaderRow';
    }
    if (index % 2) {
      return 'oddRow';
    }
    return 'evenRow';
  }

  return (
    <Paper style={{ width: w, height: h }} id="dataBrowser">
      <AutoSizer>
        {({ height, width }) => (
          <Table
            height={height}
            width={width}
            rowHeight={40}
            headerHeight={60}
            rowCount={patients.sortedPatients.length}
            rowGetter={({ index }) => patients.sortedPatients[index]}
            sort={(sortStuff) => patients.sortByColumn(sortStuff)}
            sortDirection={patients.sortedDir}
            sortBy={patients.sortedBy}
            rowClassName={getRowClass}
            headerClassName="browserHeaderContainer"
            onRowClick={patientDetails.setId}
          >
            {patients.columns.map((column) => (
              <Column
                dataKey={column.dataKey}
                key={column.label}
                width={column.width}
                label={column.label}
                headerRenderer={headerRenderer}
                cellRenderer={cellRenderer}
                disableSort={!column.sortable}
                className="browserCell"
              />
            ))}
          </Table>
        )}
      </AutoSizer>
      <PatientDetails
        patientDetails={patientDetails}
        container={document.getElementById('dataBrowser')}
      />
    </Paper>
  );
}

export default DataBrowser;
