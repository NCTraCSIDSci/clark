import React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import shortid from 'shortid';

import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';
import CheckIcon from '@material-ui/icons/Check';

import './regexTable.css';

import prettyString from '../../../helperFunctions/prettyString';
import getCombinedColor from '../../../helperFunctions/getCombinedColor';
import AddRegexModal from './AddRegexModal';

function RegexTable(props) {
  const { regex } = props;

  return (
    <div id="setupDataLeftTable">
      <List id="setupDataLeftTab">
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
        <div className="bottomDrawerButtons">
          <ListItem
            button
            onClick={regex.uploadRegex}
          >
            <ListItemText primary="Upload" />
          </ListItem>
          <ListItem
            button
            onClick={regex.saveRegex}
          >
            <ListItemText primary="Save" />
          </ListItem>
        </div>
      </List>
      <div id="setupDataLeftContainer">
        {regex.tab === 'sections' && (
          <div id="sectionBreak">
            <h2>Section Breaker: </h2>
            <TextField
              value={regex.sectionBreak}
              onChange={(e) => regex.updateSectionBreak(e.target.value)}
              variant="outlined"
            />
          </div>
        )}
        <Table stickyHeader id="regexTable">
          <TableHead>
            <TableRow>
              <TableCell className="regexIconCell">
                Edit
              </TableCell>
              {regex.columns.map((column) => (
                <TableCell
                  key={shortid.generate()}
                >
                  {column.label}
                </TableCell>
              ))}
              {regex.tab === 'expressions' && (
                <TableCell className="regexIconCell">
                  Color
                </TableCell>
              )}
              <TableCell className="regexIconCell">
                Delete
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {regex.rows.map((row, i) => {
              const { r, g, b } = getCombinedColor([row.color]);
              const backgroundColor = `rgb(${r}, ${g}, ${b})`;
              return (
                <TableRow
                  key={shortid.generate()}
                  className="regexTableRow"
                  hover
                >
                  <TableCell>
                    <IconButton onClick={() => regex.openModal(i)}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    {row.name}
                  </TableCell>
                  <TableCell>
                    {row.regex}
                  </TableCell>
                  {regex.tab === 'expressions' && (
                    <TableCell>
                      <div className="regexColor" style={{ backgroundColor }} />
                    </TableCell>
                  )}
                  {regex.tab === 'sections' && (
                    <TableCell>
                      {row.ignore && (
                        <CheckIcon />
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <IconButton onClick={() => regex.remove(i)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div id="addRegexButton">
          <IconButton
            onClick={() => regex.openModal()}
          >
            <AddIcon />
          </IconButton>
        </div>
      </div>
      <AddRegexModal
        regex={regex}
        container={document.getElementById('tabsContainer')}
      />
    </div>
  );
}

export default RegexTable;
