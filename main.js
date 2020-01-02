// CLARK electron startup script

const electron = require('electron');
// Module to control application life.
const { app } = electron;

const config = require('./config.json');

const serverUrl = `${config.protocol}://${config.host}:${config.port}/`;

app.commandLine.appendSwitch('enable-transparent-visuals');
app.commandLine.appendSwitch('disable-gpu');
// Module to create native browser window.
const { BrowserWindow } = electron;

const path = require('path');
const url = require('url');
const fs = require('fs');
const rq = require('request-promise');
const os = require('os');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Grab command line input arguments for later processing
const args = require('minimist')(process.argv.slice(2)); // slice off electron call and main.js

global.shared = { inputArguments: args };

let developmentMode = false;
if (Object.prototype.hasOwnProperty.call(args, 'd')) {
  developmentMode = true;
}

// Determine executable binary file extension (for the pyinstaller)
const type = os.type();
let binaryEnding = '.exe';
if (type === 'Linux' || type === 'Darwin') {
  binaryEnding = '';
}


function createWindow() {
  console.log('ELECTRON: Starting servers and creating windows.');
  let subpy;
  const { spawn } = require('child_process');
  const cp = require('child_process');
  /* This is a check to see if we are running in packaged or unpackaged mode. */
  fs.stat('./clarkproc/clarkproc/server_app.py', (err, stats) => {
    // If this errors, we can't find the server python function - We must be deployed
    if (err) {
      // the path will look something like this.../build_app/mac/clark.app/Contents/Resources/app
      // We need to spawn .../build_app/mac/clark.app/Contents/server/clark_server{binaryEnding}
      let serverExe = app.getAppPath();
      // the path is different on windows and mac
      if (type === 'Windows_NT') {
        [serverExe] = serverExe.split('resources');
        serverExe = `${serverExe}server/clark_server${binaryEnding}`;
      } else {
        [serverExe] = serverExe.split('Resources');
        serverExe = `${serverExe}server/clark_server${binaryEnding}`;
      }

      // Note these console.log()'s likely show up in a hidden window started by the installed application
      // On OSX if you build without ASAR you can see these logs by exploring the APP contents and runing the exclosed binary

      // Try to find the binary file
      fs.stat(serverExe, (error, stat) => { // eslint-disable-line
        if (error) {
          console.log('Can\'t find binary file.');
          throw error;
        } else {
          subpy = spawn(serverExe, [config.protocol, config.host, config.port]);
          console.log('ELECTRON: Starting deployment python server.');
          // Map console logging of the spawned processes into the active command line
          subpy.stdout.on('data', (data) => {
            console.log(`PYTHON: ${data}`);
          });

          subpy.stderr.on('data', (data) => {
            console.log(`PYTHON: ${data}`);
          });
        }
      });
    } else {
      // We can find the server python script, assume we are running from a terminal
      // with the correct python environment, and just start the script
      console.log('ELECTRON: Starting development python server.');
      subpy = spawn('python', ['./clarkproc/clarkproc/server_app.py', config.protocol, config.host, config.port]);
      // Map console logging of the spawned processes into the active command line
      subpy.stdout.on('data', (data) => {
        console.log(`PYTHON: ${data}`);
      });

      subpy.stderr.on('data', (data) => {
        console.log(`PYTHON: ${data}`);
      });
    }
  });

  const openWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 1300,
      height: 1000,
      webPreferences: {
        nodeIntegration: true,
      },
    });
    // mainWindow.once('ready-to-show', () => {
    //   mainWindow.show()
    // })
    mainWindow.maximize();

    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

    let html = './build_ui/index.html';
    if (developmentMode) {
      html = './ui/index.html';
    }
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, html),
      protocol: 'file:',
      slashes: true,
    }), { extraHeaders: 'pragma: no-cache\n' });


    // Open the DevTools if we should - Command line argument
    if (developmentMode) {
      mainWindow.webContents.openDevTools();
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
      installExtension(REACT_DEVELOPER_TOOLS)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err));
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      console.log('starting the shutdown', `${serverUrl}shutdown`);
      rq(`${serverUrl}shutdown`)
        .then((res) => {
          console.log('ELECTRON: Server shutdown', res);
        })
        .catch((err) => {
          console.log('there was an error');
          console.log(err.response);
          console.log(err.status);
          console.log(err.response.data);
        });

      mainWindow = null;
      // On Windows, we have to manually kill the container application, otherwise
      // we will leave one zombie process running.

      if (type === 'Windows_NT') {
        // wmic process kills all processes with this name
        cp.exec('wmic process where name="clark_server.exe" delete');
        // the below didn't appear to work, but everyone says it should...
        /* cp.exec('taskkill', ['/PID', subpy.pid, '/T', '/F'], function (error, stdout, stderr) {
                     console.log('stdout: ' + stdout);
                     console.log('stderr: ' + stderr);
                     if(error !== null) {
                          console.log('exec error: ' + error);
                     }
                }); */
      }
    });
  };

  openWindow();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  app.quit();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
