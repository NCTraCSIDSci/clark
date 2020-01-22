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
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import shortid from 'shortid';

import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';
import CheckIcon from '@material-ui/icons/Check';
import PublishIcon from '@material-ui/icons/Publish';
import SaveIcon from '@material-ui/icons/Save';
import SearchIcon from '@material-ui/icons/Search';

import './regexTable.css';

import prettyString from '../../../helperFunctions/prettyString';
import getCombinedColor from '../../../helperFunctions/getCombinedColor';
import AddRegexModal from './AddRegexModal';

function RegexTable(props) {
  const { regex, editable, numPatients } = props;

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
      </List>
      <div id="setupDataLeftContainer">
        {regex.tab === 'sections' && (
          <div id="sections">
            <div id="sectionBreak">
              <h2>Section Breaker: </h2>
              <TextField
                value={regex.sectionBreak}
                onChange={(e) => regex.updateSectionBreak(e.target.value)}
                variant="outlined"
                disabled={!editable}
              />
            </div>
            <FormGroup row className="sectionHeadAndUnnamed">
              <h4>Header</h4>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={regex.ignoreHeader}
                    onChange={(e) => regex.updateHeaderIgnore(e.target.checked)}
                    value="ignore"
                    disabled={!editable}
                  />
                )}
                label="Ignore"
              />
              <div className="regexColor" style={{ backgroundColor: 'rgb(198, 198, 198)' }} />
            </FormGroup>
            <FormGroup row className="sectionHeadAndUnnamed">
              <h4>Unnamed Sections</h4>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={regex.ignoreUnnamed}
                    onChange={(e) => regex.updateUnnamedIgnore(e.target.checked)}
                    value="ignore"
                    disabled={!editable}
                  />
                )}
                label="Ignore"
              />
              <div className="regexColor" style={{ backgroundColor: 'rgb(99, 190, 255)' }} />
            </FormGroup>
          </div>
        )}
        <div id="regexTable">
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {editable && (
                  <TableCell className="regexIconCell">
                    Edit
                  </TableCell>
                )}
                {regex.columns.map((column) => (
                  <TableCell
                    key={shortid.generate()}
                  >
                    {column.label}
                  </TableCell>
                ))}
                {regex.tab === 'expressions' && editable && (
                  <TableCell className="regexIconCell">
                    Coverage
                  </TableCell>
                )}
                {regex.tab !== 'library' && (
                  <TableCell className="regexIconCell">
                    Color
                  </TableCell>
                )}
                {editable && (
                  <TableCell className="regexIconCell">
                    Delete
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {regex.rows.map((row, i) => {
                const backgroundColor = getCombinedColor([row.color]);
                return (
                  <TableRow
                    key={shortid.generate()}
                    className="regexTableRow"
                    hover
                  >
                    {editable && (
                      <TableCell>
                        <IconButton onClick={() => regex.openModal(i)}>
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    )}
                    <TableCell>
                      {row.name}
                    </TableCell>
                    <TableCell>
                      {row.regex}
                    </TableCell>
                    {regex.tab === 'sections' && (
                      <TableCell>
                        {row.ignore && (
                          <CheckIcon />
                        )}
                      </TableCell>
                    )}
                    {regex.tab === 'expressions' && editable && (
                      <TableCell>
                        {row.hasOwnProperty('coverage') ? (
                          row.coverage / numPatients
                        ) : (
                          <IconButton onClick={() => regex.getCoverage(i, row.compiled || row.regex)}>
                            <SearchIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    )}
                    {regex.tab !== 'library' && (
                      <TableCell>
                        <div className="regexColor" style={{ backgroundColor }} />
                      </TableCell>
                    )}
                    {editable && (
                      <TableCell>
                        <IconButton onClick={() => regex.remove(i)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {editable && (
          <>
            <div id="addRegexButton">
              <IconButton
                onClick={() => regex.openModal()}
              >
                <AddIcon />
              </IconButton>
            </div>
            <div id="bottomRegexButtons">
              <IconButton
                onClick={regex.saveRegex}
              >
                <SaveIcon />
              </IconButton>
              <IconButton
                onClick={regex.uploadRegex}
              >
                <PublishIcon />
              </IconButton>
            </div>
          </>
        )}
      </div>
      <AddRegexModal
        regex={regex}
        container={document.getElementById('tabsContainer')}
      />
    </div>
  );
}

export default RegexTable;
