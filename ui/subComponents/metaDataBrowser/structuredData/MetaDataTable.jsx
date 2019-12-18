import React, { useState, useRef } from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import { Virtuoso } from 'react-virtuoso';
import AutoSizer from 'react-virtualized-auto-sizer';
import shortid from 'shortid';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import CheckIcon from '@material-ui/icons/Check';

import './metaData.css';

import prettyString from '../../../helperFunctions/prettyString';


function MetaDataTable(props) {
  const { metaData, numPatients, editable } = props;
  const show = !metaData.loading;
  const [expanded, setExpanded] = useState(-1);
  const scrollPosition = useRef(null);

  function updateExpanded(index) {
    if (expanded === index) return setExpanded(-1);
    return setExpanded(index);
  }

  function noData() {
    return <div id="noMetaData">{`No ${metaData.tab} to show`}</div>;
  }

  function patientMetaDataList() {
    const list = metaData.patientMetaData.map((row, index) => {
      const selectedMetaData = metaData.metaData.patient[row.display] || [];
      return (
        <ExpansionPanel
          key={shortid.generate()}
          className="metaDataItem"
          expanded={expanded === index}
          onChange={() => updateExpanded(index)}
        >
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            className="metaDataItemTitle"
          >
            <div className="metaDataItemModified">
              {selectedMetaData.length > 0 && (
                <CheckIcon />
              )}
            </div>
            <div className="metaDataDisplay">
              {prettyString(row.display)}
            </div>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails className="metaDataPanel">
            <div className="aggregationMethodButtons">
              {row.display === 'age' ? (
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <DatePicker
                    clearable
                    format="MM/dd/yyyy"
                    value={metaData.metaData.patient.date || null}
                    onChange={(date) => metaData.updateDate(date)}
                    placeholder="01/01/2020"
                  />
                  <Button
                    variant="contained"
                    className={selectedMetaData.indexOf('numeric') !== -1 ? 'checkedMetaData' : 'uncheckedMetaData'}
                    endIcon={selectedMetaData.indexOf('numeric') !== -1 ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
                    onClick={() => metaData.updateMetaData(row.display, 'numeric')}
                    disabled={!editable || !metaData.metaData.patient.date}
                  >
                    Numeric
                  </Button>
                  <Button
                    variant="contained"
                    className={selectedMetaData.indexOf('binned') !== -1 ? 'checkedMetaData' : 'uncheckedMetaData'}
                    endIcon={selectedMetaData.indexOf('binned') !== -1 ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
                    onClick={() => metaData.updateMetaData(row.display, 'binned')}
                    disabled={!editable || !metaData.metaData.patient.date}
                  >
                    Binned
                  </Button>
                </MuiPickersUtilsProvider>
              ) : (
                <Button
                  variant="contained"
                  className={selectedMetaData.indexOf('one-hot') !== -1 ? 'checkedMetaData' : 'uncheckedMetaData'}
                  endIcon={selectedMetaData.indexOf('one-hot') !== -1 ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
                  onClick={() => metaData.updateMetaData(row.display, 'one-hot')}
                  disabled={!editable}
                >
                  Use
                </Button>
              )}
            </div>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      );
    });
    return list;
  }

  function generateItem(index) {
    const item = metaData.filteredList[index];
    const selectedMetaData = metaData.metaData[metaData.tab][`(${item.system}, ${item.code})`] || [];
    return (
      <ExpansionPanel
        key={shortid.generate()}
        className="metaDataItem"
        expanded={expanded === index}
        onChange={() => updateExpanded(index)}
      >
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          className="metaDataItemTitle"
        >
          <div className="metaDataItemModified">
            {selectedMetaData.length > 0 && (
              <CheckIcon />
            )}
          </div>
          <div className="metaDataDisplay">
            {item.display}
          </div>
          <div className="metaDataCoverage">
            {(item.unique_count / numPatients).toPrecision(2)}
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className="metaDataPanel">
          <p>Aggregation Methods</p>
          <div className="aggregationMethodButtons">
            {metaData.filter[metaData.tab].features.map((feature) => (
              <Button
                key={shortid.generate()}
                variant="contained"
                className={selectedMetaData.indexOf(feature) !== -1 ? 'checkedMetaData' : 'uncheckedMetaData'}
                endIcon={selectedMetaData.indexOf(feature) !== -1 ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
                onClick={() => metaData.updateMetaData(`(${item.system}, ${item.code})`, feature)}
                disabled={!editable}
              >
                {prettyString(feature)}
              </Button>
            ))}
          </div>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  return (
    <div id="setupDataLeftTable">
      <div id="setupDataLeftTab">
        <List>
          {Object.keys(metaData.filter).map((filterKey) => (
            <ListItem
              key={shortid.generate()}
              button
              onClick={() => {
                metaData.setTab(filterKey);
                setExpanded(-1);
                if (filterKey !== 'patient' && metaData.tab !== 'patient') {
                  scrollPosition.current.scrollToIndex({ index: 0 });
                }
              }}
              className={metaData.tab === filterKey ? 'activeMetaDataTab' : ''}
            >
              <ListItemText primary={prettyString(filterKey)} />
            </ListItem>
          ))}
        </List>
      </div>
      {show ? (
        <div id="setupDataLeftContainer">
          <div id="setupDataSortBar">
            {metaData.tab !== 'patient' && (
              <>
                <div id="metaDataTextSearch">
                  <TextField
                    onChange={(e) => metaData.updateFilter('text', e.target.value)}
                    margin="none"
                    className="searchTextField metaDataSearch"
                    inputProps={{ style: { padding: '3px 0px' } }}
                    value={metaData.filter[metaData.tab].text}
                  />
                </div>
                <TableSortLabel
                  active
                  direction={metaData.filter[metaData.tab].sort}
                  onClick={() => metaData.updateFilter('sort')}
                >
                  Coverage
                </TableSortLabel>
              </>
            )}
          </div>
          <div id="setupDataList">
            <AutoSizer>
              {({ width, height }) => (
                <>
                  {metaData.tab !== 'patient' ? (
                    <Virtuoso
                      totalCount={metaData.filteredList.length || 1}
                      overscan={50}
                      style={{ height, width }}
                      item={metaData.filteredList.length ? generateItem : noData}
                      ref={scrollPosition}
                    />
                  ) : (
                    <div
                      style={{ height, width }}
                      ref={scrollPosition}
                    >
                      {patientMetaDataList()}
                    </div>
                  )}
                </>
              )}
            </AutoSizer>
          </div>
        </div>
      ) : (
        <CircularProgress size={100} thickness={2} />
      )}
    </div>
  );
}

export default MetaDataTable;
