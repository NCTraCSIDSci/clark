import { useState } from 'react';

function usePopup() {
  const [content, setContent] = useState({});
  const [show, toggle] = useState(false);

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

  return {
    show,
    toggle,
    content,
    showModal,
  };
}

export default usePopup;
