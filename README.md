# CLARK (Clinical Annotation Research Kit)

CLARK is a natural language processing and machine learning application designed to make free-text data useful for computable phenotyping. CLARK takes free-text clinical notes as input and classifies those notes (and the associated patients) based on features (words and phrases) defined by the user. For each patient, CLARK outputs a classification (e.g., “Type 1 diabetic”), a confidence level, and significant features, essentially deriving structured “facts” from the contents of that patient’s unstructured notes. Thus far, CLARK has been applied at UNC to create computable phenotypes for diabetes, uterine fibroids, and primary ciliary dyskinesia (PCD).

CLARK was developed by [NC TraCS](https://tracs.unc.edu) and [CoVar](https://covar.com).

## About
CLARK is a cross-platform desktop application leveraging [Electron](https://electronjs.org), a Python based machine learning engine and a [React](http://Reactjs.org) based user interface.

## Executable and User Documentation
To download the CLARK executable without having to package it from source yourself, go to [the NC TraCS website](https://tracs.unc.edu/index.php/tracs-resources/sharehub/category/2-informatics) and download the CLARK zip file. (A demo dataset is also included.)

User documentation is available in the /docs folder in this repo, and can also be viewed at [this link](https://htmlpreview.github.io/?https://raw.githubusercontent.com/NCTraCSIDSci/clark/master/docs/clark-documentation.html).

## Development Instructions

### Python setup:
Python setup requires python 3.7.* and several dependencies found in `./clarkproc/requirements.txt`. These requirements are best installed in a virtual environment (Note: if you want to use python 3.8, checkout that branch for an updated requirements.txt. You can run the application locally, but building an installer will not work.)
- Set up a virtual environment.
   - mac: `python3 -m virtualenv ~/.venv/clark`
   - windows: `python -m virtualenv %systemdrive%%homepath%\.venv\clark`
- Activate the virtual environment.
   - mac: `source ~/.venv/clark/bin/activate`
   - windows: `%systemdrive%%homepath%\.venv\clark\Scripts\activate`
- Install the requirements
  ```
    cd clarkproc
    pip install -r requirements.txt
  ```
- If you plan on making your own executable, you need to run this command as well:
  ```
    pip install -r requirements-dev.txt
  ```
- Finally, go back one directory to get back to the main folder:
  ```
    cd ..
  ```

### User Interface:
Building the user interface requires [NPM](https://www.npmjs.com). Dependencies can be installed by calling
```
npm install
```

## Run the application locally:
From a command line with the activated python environment, the application can be started using:
(note: this will require you to run this command after you make any changes)
```
npm start
```
- If you would like automatic reloading when you make ui changes, open a terminal and run:
```
npm run watch
```
Open another terminal, activate the python environment, and run:
```
npm run electron
```

## Packaging:
Packaging is handled using [PyInstaller](http://www.pyinstaller.org) to bundle the Python engine and [Electron Builder](http://electron.build) to package everything together and build standalone applications and/or installers. Execution of each of these commands can be done using npm scripts.

- Bundles the javascript
  ```
  npm run build_ui
  ```
- Bundles python libraries into standalone binary
  ```
  npm run build_server
  ```
- Following calls to both `build_server` and `build_ui`, a standalone application can be made using
  ```
  npm run build_standalone
  ```
- Following calls to both `build_server` and `build_ui`, an installer can be made using
  ```
  npm run build_installer
  ```

Packages are best built on the native architecture.