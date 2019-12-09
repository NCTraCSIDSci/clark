import { remote } from 'electron';

const fs = remote.require('fs');

function loadSession(setDir, setSteps, metaData, regex, algo) {
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
        console.log('setup', setup);
        setDir(setup.directoryPath);
        metaData.loadMetaData(setup.metaData);
        regex.loadRegex(setup.regex);
        algo.loadAlgo(setup.algo);
        setSteps(setup.steps);
      }
    });
  }
}

export default loadSession;
