import { useState } from 'react';
import parseErrors from '../helperFunctions/parseErrors';

function usePopup() {
  const [content, setContent] = useState({});
  const [show, toggle] = useState(false);
  const [errors, updateErrors] = useState('');
  const [showSnack, toggleSnackbar] = useState(false);
  const [snackbarContent, setSnackbarContent] = useState({});

  /**
   * @param {Object} config - config object for dialog to display
   * @param {boolean} config.disableBackdrop - can the user close on backdrop click
   * @param {boolean} config.error - is this an error dialog, colors header red
   * @param {string} config.header - header text
   * @param {string} config.text - content text
   * @param {Object[]} config.actions - action buttons in footer
   * @param {string} config.actions[].text - text of the button
   * @param {boolean} config.actions[].autoFocus - should autoFocus on button
   * @param {function} config.actions[].click - function to call when button pressed
   */
  function showModal(config) {
    if (typeof config.text === 'object' && config.text !== null) {
      config.text = JSON.stringify(config.text);
    }
    setContent(config);
    toggle(true);
  }

  function showSnackbar(config) {
    setSnackbarContent(config);
    toggleSnackbar(true); // will close itself
  }

  function receiveErrors(errs) {
    updateErrors(parseErrors(errs, showSnackbar, toggle));
  }

  function showErrors() {
    const config = {
      disableBackdrop: false,
      error: true,
      header: 'Errors',
      text: errors,
      actions: [
        {
          text: 'Close',
          autoFocus: true,
          click: () => toggle(false),
        },
      ],
    };
    setContent(config);
    toggle(true);
  }

  return {
    show,
    toggle,
    content,
    errors,
    receiveErrors,
    showModal,
    showErrors,
    showSnackbar,
    showSnack,
    toggleSnackbar,
    snackbarContent,
  };
}

export default usePopup;
