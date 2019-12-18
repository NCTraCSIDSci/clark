import { remote } from 'electron';

const fs = remote.require('fs');

function saveSession(dirPath, steps, metaData, regex, algo, popup) {
  let saveObj = {};
  saveObj.fhir_directory = dirPath;
  saveObj.structured_data = metaData;
  saveObj.unstructured_data = regex;
  saveObj.algo = algo;
  saveObj.steps = steps;
  saveObj = JSON.stringify(saveObj);
  const path = remote.dialog.showSaveDialogSync({
    defaultPath: 'clark_session',
    filters: [{
      name: 'JSON',
      extensions: ['json'],
    }],
  });
  if (path) {
    fs.writeFile(path, saveObj, (error) => {
      if (error) {
        popup.showSnackbar({
          text: 'Failed to save this session.',
          type: 'error',
        });
      } else {
        popup.showSnackbar({
          text: 'Session saved successfully.',
          type: 'success',
        });
      }
    });
  }
}

export default saveSession;
