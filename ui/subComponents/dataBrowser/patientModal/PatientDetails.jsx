import React, { useState, useEffect } from 'react';
import Zoom from '@material-ui/core/Zoom';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import shortid from 'shortid';

import MenuIcon from '@material-ui/icons/Menu';

import './patientModal.css';

import prettyString from '../../../helperFunctions/prettyString';

import PatientTable from './PatientTable';
import PatientNotes from './PatientNotes';

const blacklist = ['birthDate', 'gender', 'id', 'maritalStatus'];
const Transition = React.forwardRef((props, ref) => <Zoom ref={ref} {...props} />); // eslint-disable-line react/jsx-props-no-spreading

const PatientDetails = (props) => {
  const {
    patientDetails, container, regex, type, popup,
  } = props;
  const {
    birthDate, gender, id, maritalStatus,
  } = patientDetails.patient;
  const patientKeys = Object.keys(patientDetails.patient).filter((key) => blacklist.indexOf(key) < 0);
  const [open, setOpen] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    if (!open) {
      setOpen(patientKeys[0]);
    }
  }, [patientDetails.patient]);

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
            <h3>
              {prettyString(open)}
            </h3>
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              id="drawerOpenButton"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              {patientKeys.map((key) => (
                <MenuItem
                  key={shortid.generate()}
                  onClick={() => { setOpen(key); setMenuAnchor(null); }}
                >
                  {prettyString(key)}
                </MenuItem>
              ))}
            </Menu>
          </DialogTitle>
          <DialogContent
            id="patientDetails"
          >
            {open && (
              <>
                {/* <h4>{(open[0].toUpperCase() + open.slice(1)).replace(/_/g, ' ')}</h4> */}
                {Array.isArray(patientDetails.patient[open]) ? (
                  <PatientNotes
                    noteIds={patientDetails.patient[open]}
                    patientId={patientDetails.patient.id}
                    regex={regex}
                    type={type}
                    popup={popup}
                  />
                ) : (
                  <PatientTable
                    tableData={patientDetails.patient[open]}
                    type={type}
                  />
                )}
              </>
            )}
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
