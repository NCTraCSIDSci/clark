import API from '../../API';

import getDirPath from './getDirPath';

function validateParsing(messages, popup) {
  const errors = [];
  Object.entries(messages.files).forEach(([file, fileMessages]) => {
    fileMessages.forEach((message) => {
      if (message.startsWith('ERROR')) {
        errors.push(`${file}: ${message.split(': ').splice(1).join(': ')}`);
      }
    });
  });
  // Only if there are errors do we show the modal
  if (errors.length) {
    popup.showModal({
      disableBackdrop: false,
      error: true,
      header: 'Warning: Failed to parse some files',
      text: errors.join('\n'),
      actions: [
        {
          text: 'Continue',
          autoFocus: true,
          click: () => popup.toggle(false),
        },
      ],
    });
  }
}

/**
 * Gets the directory path from user and moves them to the next step
 * @param {object} popup shows error popup if failed
 * @param {function} setLoading sets loading to false
 * @param {function} setTab sets tab to data if successful
 * @param {function} updateSteps adds data to completed steps if successful
 * @param {function} setDirPath sets the directory path to state for save
 */
function loadData(
  popup, setLoading, setTab,
  setFhirDirectory, resetState,
) {
  const dirPath = getDirPath();
  if (dirPath) {
    setLoading(true);
    API.load([dirPath], 'fhir')
      .then((result) => {
        setLoading(false);
        validateParsing(result.messages, popup);
        popup.receiveErrors(result.messages);
        setTab('data');
        setFhirDirectory(dirPath);
        resetState();
        popup.showSnackbar({
          text: 'Successfully uploaded data.',
          type: 'success',
        });
      })
      .catch((err) => {
        setLoading(false);
        // updateSteps('');
        popup.receiveErrors({});
        popup.showModal({
          disableBackdrop: false,
          error: true,
          header: 'Error',
          text: err,
          actions: [
            {
              text: 'Close',
              autoFocus: true,
              click: () => popup.toggle(false),
            },
          ],
        });
        // setDirPath('');
      });
  }
}

export default loadData;
