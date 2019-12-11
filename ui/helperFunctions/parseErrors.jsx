import React from 'react';
import Button from '@material-ui/core/Button';
import { remote } from 'electron';

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

function parseErrors(errorObj, snackbar) {
  const { files, general, linking } = errorObj;
  const errs = [];
  if (general.length) {
    errs.push(
      <Button key="generalErrors" onClick={() => downloadErrors('general', general, snackbar)}>
        Download General Errors
      </Button>,
    );
  }
  if (linking.length) {
    errs.push(
      <Button key="linkingErrors" onClick={() => downloadErrors('linking', linking, snackbar)}>
        Download Linking Errors
      </Button>,
    );
  }
  if (Object.keys(files).length) {
    errs.push(
      <Button key="filesErrors" onClick={() => downloadErrors('files', files, snackbar)}>
        Download Files Errors
      </Button>,
    );
  }
  return errs;
  // const fileErrs = Object.keys(files).map((file) => {
  //   let errStr = '';
  //   if (files[file].length) {
  //     errStr += `${file}\n`;
  //     files[file].forEach((err) => {
  //       errStr += `${err}\n`;
  //     });
  //   }
  //   return errStr;
  // }).join('\n');
  // const parsedErrors = `${fileErrs}\n\n${genErrs}\n\n${linkErrs}`;
  // updateErrors(parsedErrors);
}

export default parseErrors;
