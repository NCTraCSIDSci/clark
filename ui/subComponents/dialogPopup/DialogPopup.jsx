import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import shortid from 'shortid';

import './dialogPopup.css';

const DialogPopup = (props) => {
  const { popup } = props;
  const dialogHeaderId = popup.content.error ? 'errorDialogHeader' : 'dialogHeader';
  return (
    <Dialog
      open={popup.show}
      onClose={() => popup.toggle(false)}
      maxWidth="sm"
      fullWidth
      disableBackdropClick={popup.content.disableBackdrop}
      disableEscapeKeyDown={popup.content.disableBackdrop}
    >
      <DialogTitle id={dialogHeaderId}>
        {popup.content.header}
      </DialogTitle>
      <DialogContent id="dialogContent">
        <DialogContentText
          id={popup.content.error ? 'errorMessage' : ''}
        >
          {popup.content.text}
        </DialogContentText>
      </DialogContent>
      <DialogActions id="dialogActions">
        {popup.content.actions && popup.content.actions.map((action) => (
          <Button
            onClick={action.click}
            autoFocus={action.autoFocus}
            className="popupButton"
            disableFocusRipple
            key={shortid.generate()}
          >
            {action.text}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export default DialogPopup;
