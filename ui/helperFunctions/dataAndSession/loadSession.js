import { remote } from 'electron';

import API from '../../API';

import validateSessionFile from '../validateSessionFile';

const fs = remote.require('fs');

function loadSession(
  setTab, popup, setLoading, updateSession,
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
              updateSession(setup);
              popup.receiveErrors(res.messages);
              if (setup.steps.includes('algo')) {
                setTab('algo');
              } else {
                setTab('data');
              }
              popup.showSnackbar({
                type: 'success',
                text: 'Successfully loaded session.',
              });
            })
            .catch(() => {
              setLoading(false);
              popup.showSnackbar({
                text: 'Failed to load fhir data.',
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