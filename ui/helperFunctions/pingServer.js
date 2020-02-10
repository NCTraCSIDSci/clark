import API from '../API';

let count = 0;

function pingServer(popup, updateServer) {
  API.ping()
    .then(() => {
      updateServer(true);
    })
    .catch(() => {
      if (count < 10) {
        count += 1;
        setTimeout(() => pingServer(popup, updateServer), 1000);
      } else {
        popup.showModal({
          disableBackdrop: true,
          error: true,
          header: 'Server failed',
          text: 'The server failed to initialize. Please try restarting the application.',
          actions: [
            {
              text: 'Close',
              autoFocus: true,
              click: () => popup.toggle(false),
            },
          ],
        });
      }
    });
}

export default pingServer;
