import { remote } from 'electron';

import validateSessionFile from '../validateSessionFile';

const fs = remote.require('fs');

function loadSession(setDir, setSteps, setTab, metaData, regex, algo) {
  const path = remote.dialog.showOpenDialogSync({
    filters: [{
      name: 'JSON',
      extensions: ['json'],
    }],
  });
  if (path) {
    fs.readFile(path[0], 'utf-8', (err, data) => {
      if (err) {
        console.log('Error loading session:', err);
      } else {
        const setup = JSON.parse(data);
        if (validateSessionFile(setup)) {
          console.log('setup', setup);
          setDir(setup.fhir_directory);
          metaData.loadMetaData(setup.structured_data);
          regex.loadRegex(setup.unstructured_data);
          algo.loadAlgo(setup.algo);
          setSteps(setup.steps);
          if (setup.steps.includes('algo')) {
            setTab('algo');
          } else {
            setTab('data');
          }
        } else {
          console.log('Bad session file');
        }
      }
    });
  }
}

export default loadSession;
