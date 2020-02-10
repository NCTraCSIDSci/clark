import { remote } from 'electron';

import API from '../../API';

import validateSessionFile from '../validateSessionFile';

const fs = remote.require('fs');

function loadSession(
  setTab, popup, setLoading, updateSession,
  setFhirDirectory, setSteps, loadAlgo, loadMetaData,
  loadRegex,
) {
  const path = remote.dialog.showOpenDialogSync({
    filters: [{
      name: 'JSON',
      extensions: ['json'],
    }],
  });
  if (path) {
    fs.readFile(path[0], 'utf-8', (err, data) => {
      if (err) {
        popup.showSnackbar({
          type: 'error',
          text: 'Failed to read file.',
        });
      } else {
        const setup = JSON.parse(data);
        if (validateSessionFile(setup)) {
          setLoading(true);
          API.load([setup.fhir_directory], 'fhir')
            .then((res) => {
              setLoading(false);
              setFhirDirectory(setup.fhir_directory);
              loadMetaData(setup.structured_data);
              loadRegex(setup.unstructured_data);
              loadAlgo(setup.algo);
              setSteps(setup.steps);
              updateSession(setup);
              if (setup.steps.includes('data')) {
                setTab('algo');
              } else {
                setTab('data');
              }
              popup.receiveErrors(res.messages);
              popup.showSnackbar({
                type: 'success',
                text: 'Successfully loaded session.',
              });
            })
            .catch(() => {
              setLoading(false);
              popup.showSnackbar({
                text: 'Failed to load session.',
                type: 'error',
              });
            });
        } else {
          popup.showSnackbar({
            type: 'error',
            text: 'Invalid session file.',
          });
        }
      }
    });
  }
}

export default loadSession;
