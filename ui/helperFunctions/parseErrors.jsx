import React from 'react';
import Button from '@material-ui/core/Button';
import { remote } from 'electron';

import prettyString from './prettyString';

const fs = remote.require('fs');

function downloadErrors(pathname, errs, snackbar) {
  const filePath = remote.dialog.showSaveDialogSync({
    defaultPath: `clark_${pathname}_errors`,
    filters: [{
      name: 'JSON',
      extensions: ['json'],
    }],
  });
  if (filePath) {
    const file = JSON.stringify(errs);
    fs.writeFile(filePath, file, (err) => {
      if (err) {
        // show error snackbar
        snackbar({
          text: 'Unable to save the errors file.',
          type: 'error',
        });
      } else {
        // show success snackbar
        snackbar({
          text: `Successfully saved the ${pathname} errors file.`,
          type: 'success',
        });
      }
    });
  }
}

/**
 * Turns error object into buttons that will download all errors.
 * @param {*} errorObj Error object received from the backend with all
 * errors found in uploaded files.
 * @param {*} snackbar Snackbar hook to provide feedback on success of
 * downloading errors.
 */
function parseErrors(errorObj, snackbar) {
  const errs = [];
  Object.keys(errorObj).forEach((key) => {
    if (Array.isArray(errorObj[key])) {
      if (errorObj[key].length) {
        errs.push(
          <Button
            key={`${key}Errors`}
            onClick={() => downloadErrors(key, errorObj[key], snackbar)}
            variant="contained"
          >
            {`Download ${prettyString(key)} Errors`}
          </Button>,
        );
      }
    } else if (Object.keys(errorObj[key]).length) {
      // Check if any files have any errors
      const hasErrors = Object.keys(errorObj[key]).find((file) => errorObj[key][file].length);
      // Only if there are errors do we show the button
      if (hasErrors) {
        errs.push(
          <Button
            key={`${key}Errors`}
            onClick={() => downloadErrors(key, errorObj[key], snackbar)}
            variant="contained"
          >
            {`Download ${prettyString(key)} Errors`}
          </Button>,
        );
      }
    }
  });
  return errs;
}

export default parseErrors;
