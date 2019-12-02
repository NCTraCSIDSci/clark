import React, { useState } from 'react';
import Zoom from '@material-ui/core/Zoom';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Drawer from '@material-ui/core/Drawer';
import Divider from '@material-ui/core/Divider';
import CircularProgress from '@material-ui/core/CircularProgress';
import shortid from 'shortid';

import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';

import './patientModal.css';

import prettyString from '../../../helperFunctions/prettyString';

import PatientTable from './PatientTable';
import PatientNotes from './PatientNotes';

const blacklist = ['birthDate', 'gender', 'id', 'maritalStatus'];
const Transition = React.forwardRef((props, ref) => <Zoom ref={ref} {...props} />); // eslint-disable-line react/jsx-props-no-spreading

const PatientDetails = (props) => {
  const { patientDetails, container, regex } = props;
  const {
    birthDate, gender, id, maritalStatus,
  } = patientDetails.patient;
  const [open, setOpen] = useState('');
  const [drawerOpen, toggleDrawer] = useState(true);
  const patientKeys = Object.keys(patientDetails.patient).filter((key) => blacklist.indexOf(key) < 0);

  return (
    <Dialog
      open={patientDetails.show}
      onClose={() => patientDetails.toggle(false)}
      TransitionComponent={Transition}
      maxWidth="xl"
      fullWidth
      container={container}
      BackdropProps={{ style: { position: 'absolute' } }}
      style={{ position: 'absolute' }}
      PaperProps={{ style: { height: '100%' } }}
      disableEnforceFocus
    >
      {!patientDetails.loading ? (
        <>
          <DialogTitle disableTypography id="patientModalTitle">
            <h2>
              {`Patient ID: ${id}`}
            </h2>
            <p>
              {`Birth Date: ${birthDate}, Gender: ${gender}, Marital Status: ${maritalStatus}`}
            </p>
            <IconButton
              size="small"
              onClick={() => toggleDrawer(true)}
              className={drawerOpen ? 'hide' : ''}
              id="drawerOpenButton"
            >
              <MenuIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent
            id="patientDetails"
            style={{ overflow: drawerOpen ? 'hidden' : '' }}
          >
            {open && (
              <>
                {/* <h4>{(open[0].toUpperCase() + open.slice(1)).replace(/_/g, ' ')}</h4> */}
                {Array.isArray(patientDetails.patient[open]) ? (
                  <PatientNotes
                    noteIds={patientDetails.patient[open]}
                    patientId={patientDetails.patient.id}
                    regex={regex}
                  />
                ) : (
                  <PatientTable
                    tableData={patientDetails.patient[open]}
                  />
                )}
              </>
            )}
            <Drawer
              variant="persistent"
              open={drawerOpen}
              ModalProps={{
                style: { position: 'absolute' },
                container: document.getElementById('patientDetails'),
              }}
              BackdropProps={{ style: { position: 'absolute' } }}
              PaperProps={{ style: { position: 'absolute' } }}
            >
              <div id="drawerCloseButton">
                <IconButton
                  onClick={() => toggleDrawer(false)}
                  size="small"
                >
                  <ChevronLeftIcon />
                </IconButton>
              </div>
              <Divider />
              <List>
                {patientKeys.map((key) => (
                  <ListItem
                    key={shortid.generate()}
                    button
                    onClick={() => { setOpen(key); toggleDrawer(false); }}
                  >
                    {prettyString(key)}
                  </ListItem>
                ))}
              </List>
            </Drawer>
          </DialogContent>
          <DialogActions id="dialogActions">
            <Button
              onClick={() => patientDetails.toggle(false)}
              className="popupButton"
            >
              Close
            </Button>
          </DialogActions>
        </>
      ) : (
        <CircularProgress />
      )}
    </Dialog>
  );
};

export default PatientDetails;
