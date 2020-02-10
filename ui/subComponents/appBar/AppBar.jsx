import React, { useState } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Drawer from '@material-ui/core/Drawer';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Badge from '@material-ui/core/Badge';

import Menu from '@material-ui/icons/Menu';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import PlaylistAddIcon from '@material-ui/icons/PlaylistAdd';
import TuneIcon from '@material-ui/icons/Tune';
import NewReleasesIcon from '@material-ui/icons/NewReleases';
import SearchIcon from '@material-ui/icons/Search';
import WarningIcon from '@material-ui/icons/Warning';
import ReportProblemOutlinedIcon from '@material-ui/icons/ReportProblemOutlined';
import SaveIcon from '@material-ui/icons/Save';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';

import './appBar.css';

function MenuBar(props) {
  const {
    tab, setTab, popup, steps, saveSession, algoRunning,
    fhirDir,
  } = props;
  const [drawerOpen, toggleDrawer] = useState(false);

  const drawerClass = drawerOpen ? 'drawerOpen' : 'drawerClosed';

  return (
    <>
      <AppBar position="fixed" className={drawerOpen ? 'appBarShift' : 'appBar'}>
        <Toolbar className="appToolbar">
          <IconButton
            onClick={() => toggleDrawer(true)}
            className={drawerOpen ? 'hide' : 'show'}
          >
            <Menu />
          </IconButton>
          <Typography variant="h4" id="appTitle">CLARK</Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        open={drawerOpen}
        className={drawerClass}
        classes={{
          paper: drawerClass,
        }}
      >
        <div id="menuButton">
          <IconButton
            onClick={() => toggleDrawer(false)}
            id="closeDrawerButton"
            data-testid="closeAppDrawerButton"
          >
            <ChevronLeft />
          </IconButton>
        </div>
        <List id="drawerList">
          <ListItem
            button
            onClick={() => setTab('landing')}
            className={tab === 'landing' ? 'activePage' : ''}
            disabled={algoRunning}
          >
            <Badge
              badgeContent={steps.indexOf('landing') > -1 ? <CheckCircleIcon className="stepCompleted" /> : ''}
            >
              <ListItemIcon><PlaylistAddIcon /></ListItemIcon>
            </Badge>
            <ListItemText primary="Load Data" />
          </ListItem>
          <ListItem
            button
            onClick={() => setTab('data')}
            className={tab === 'data' ? 'activePage' : ''}
            disabled={steps.indexOf('landing') < 0 || algoRunning}
          >
            <Badge
              badgeContent={steps.indexOf('data') > -1 ? <CheckCircleIcon className="stepCompleted" /> : ''}
            >
              <ListItemIcon><TuneIcon /></ListItemIcon>
            </Badge>
            <ListItemText primary="Setup" />
          </ListItem>
          <ListItem
            button
            onClick={() => setTab('algo')}
            className={tab === 'algo' ? 'activePage' : ''}
            disabled={steps.indexOf('data') < 0 || algoRunning}
          >
            <Badge
              badgeContent={steps.indexOf('algo') > -1 ? <CheckCircleIcon className="stepCompleted" /> : ''}
            >
              <ListItemIcon><NewReleasesIcon /></ListItemIcon>
            </Badge>
            <ListItemText primary="Algorithm" />
          </ListItem>
          <ListItem
            button
            onClick={() => setTab('explore')}
            className={tab === 'explore' ? 'activePage' : ''}
            disabled={steps.indexOf('algo') < 0 || algoRunning}
          >
            <ListItemIcon><SearchIcon /></ListItemIcon>
            <ListItemText primary="Explore" />
          </ListItem>
          <div className="bottomDrawerButtons">
            <ListItem
              button
              onClick={popup.showErrors}
              disabled={!popup.errors.length || algoRunning}
            >
              <Badge
                badgeContent={popup.errors.length ? <ErrorIcon id="errorsPresent" /> : ''}
              >
                <ListItemIcon><WarningIcon /></ListItemIcon>
              </Badge>
              <ListItemText primary="Data Errors" />
            </ListItem>
            <ListItem
              button
              onClick={popup.showTestErrors}
              disabled={!popup.testErrors.length || algoRunning}
            >
              <Badge
                badgeContent={popup.testErrors.length ? <ErrorIcon id="errorsPresent" /> : ''}
              >
                <ListItemIcon><ReportProblemOutlinedIcon /></ListItemIcon>
              </Badge>
              <ListItemText primary="Test Data Errors" />
            </ListItem>
            <ListItem
              button
              onClick={saveSession}
              disabled={!fhirDir || algoRunning}
            >
              <ListItemIcon><SaveIcon /></ListItemIcon>
              <ListItemText primary="Save" />
            </ListItem>
          </div>
        </List>
      </Drawer>
    </>
  );
}

export default MenuBar;
