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
  });
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
