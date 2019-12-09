import { remote } from 'electron';

const fs = remote.require('fs');

function saveSession(dirPath, steps, metaData, regex, algo) {
  let saveObj = {};
  saveObj.directoryPath = dirPath;
  saveObj.metaData = metaData;
  saveObj.regex = regex;
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
        console.log('Error:', error);
      } else {
        console.log('File saved successfully');
      }
    });
  }
}

export default saveSession;
