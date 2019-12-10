import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';

import './snackbarPopup.css';

const SnackbarPopup = (props) => {
  const { popup } = props;
  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      open={popup.showSnack}
      autoHideDuration={4000}
      onClose={() => popup.toggleSnackbar(false)}
    >
      <SnackbarContent
        className={`${popup.content.type}Snackbar`}
        message={popup.content.text}
      />
    </Snackbar>
  );
};

export default SnackbarPopup;
