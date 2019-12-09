import { remote } from 'electron';

export default function getDirPath() {
  let dirPath = remote.dialog.showOpenDialogSync({
    properties: ['openDirectory'],
    filters: [{
      name: 'JSON',
      extensions: ['json'],
    }],
  });
  if (dirPath) {
    [dirPath] = dirPath;
    dirPath += '/*.json';
  }
  return dirPath;
}
