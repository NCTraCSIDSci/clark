import React, { useState, useEffect } from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import shortid from 'shortid';

function PatientTable(props) {
  const { tableData } = props;
  const blacklist = ['code', 'system', 'boolean'];
  const [header, updateHeader] = useState([]);

  function cleanAndSort() {
    if (!tableData.data.length) { // if there are no rows
      return updateHeader(['No data to show']);
    }
    const tempHeader = [];
    Object.keys(tableData.data[0]).forEach((key) => {
      if (blacklist.indexOf(key) === -1) {
        tempHeader.push(key);
      }
    });
    // sort and put display/name first
    tempHeader.sort((a, b) => {
      if (a === 'display') {
        return -1;
      }
      if (b === 'display') {
        return 1;
      }
      return 0;
    });
    return updateHeader(tempHeader);
  }

  useEffect(() => {
    cleanAndSort();
  }, [tableData]);

  return (
    <div id="patientTable">
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {header.map((h) => (
              <TableCell
                key={shortid.generate()}
                align="center"
              >
                {h === 'display' ? 'Name' : h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.data.map((p, i) => (
            <TableRow key={shortid.generate()}>
              {header.map((k) => (
                <TableCell
                  key={shortid.generate()}
                >
                  {tableData.data[i][k]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default PatientTable;
