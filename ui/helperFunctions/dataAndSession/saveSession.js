import { remote } from 'electron';

const fs = remote.require('fs');

function saveSession(popup, session) {
  const save = JSON.stringify(session);
  const path = remote.dialog.showSaveDialogSync({
    defaultPath: 'clark_session',
    filters: [{
      name: 'JSON',
      extensions: ['json'],
    }],
  });
  if (path) {
    fs.writeFile(path, save, (error) => {
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
