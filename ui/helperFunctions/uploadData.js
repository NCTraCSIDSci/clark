import { remote } from 'electron';
import API from '../API';

function loadData(popup, data, setLoading, setTab) {
  const dirPathPromise = remote.dialog.showOpenDialogSync({
    properties: ['openDirectory'],
    filters: [{
      name: 'JSON',
      extensions: ['json'],
    }],
  });
  if (dirPathPromise) {
    let [dirPath] = dirPathPromise;
    dirPath += '/*.json';
    setLoading(true);
    API.load([dirPath])
      .then((result) => {
        console.log('result', result);
        setLoading(false);
        data.setData(result.patient_ids);
        setTab('data');
      })
      .catch((err) => {
        console.log('error', err);
        setLoading(false);
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
      });
  }
}

export default loadData;
