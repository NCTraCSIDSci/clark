import React from 'react';
import { ipcRenderer } from 'electron';

import 'bootstrap/dist/css/bootstrap.css';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-fresh.css';

import APIs from './api/routes';

// React comoponents that make up the user interface
import MainMenu from './components/mainMenu';
import TopMenu from './components/topMenu';
import Message from './components/message';
import FeatureEditor from './components/features/features';
import AlgorithmConfig from './components/algorithm';
import Explore from './components/explore/explore';

import './css/fontFaceOswaldLocal.css';
import './css/styles.css';

const remote = require('electron').remote;

const { dialog } = remote;

const uigetfile = params => dialog.showOpenDialog(remote.getCurrentWindow(), params);
const uiputfile = params => dialog.showSaveDialog(remote.getCurrentWindow(), params);
const isEmpty = function isEmpty(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
};

/* Application is the main driver for the application pages and
defines a single-page application.

It maintains top-level state for the page: what page is visible, what step(s) have been finished.

It also defines callback functions when a page is clicked, and callback functions when a step is finished.
*/
class Application extends React.Component {

  removeAlgorithmResults(finished) {
    // When you load / edit keywords you have to wipe out existing trained data
    // We actually don't wipe anything available in python or loaded into memory
    // We just set flags indicating that we do not have valid outputs
    // We take in and output the finished flag so that we can use this near other setState calls
    finished.trainedClassifier = false;
    finished.testResults = false;
    finished.crossValResults = false;
    return finished;
  }

  constructor(props) {
    super(props);
    this.mounted = false;
    this.state = {
      visible: {
        main: false,
        message: true,
        features: false,
        run: false,
        explore: false,
        patient: false,
      },
      finished: {
        trainingCorpus: false,
        features: false,
        testCorpus: false,
        trainedClassifier: false,
        testResults: false,
        crossValResults: false,
      },
      statusText: 'Welcome. Please load a corpus.',

      files_corpus: '',
      files_features: '',
      files_keywords: '',
      files_testCorpus: '',
      files_sections: '',

      corpus_patientTree: [{text: 'Unknown', nodes: []}],
      corpus_currentPatient: {text: 'Unknown', nodes: []},
      corpus_currentNote: {text: [''], date: ''},
      corpus_currentNoteMarkup: 'None',

      testCorpus_patientTree: [{text: 'Unknown', nodes: []}],
      testCorpus_currentPatient: {text: 'Unknown', nodes: []},
      testCorpus_currentNote: {text: [''], date: ''},

      features_keywords: [],
      features_keywordsHasBeenEdited: false,
      features_expressions: [],
      features_expressionsHasBeenEdited: false,
      features_sectionNames: [],
      features_sectionBreak: [],
      features_sectionsHasBeenModified: false,

      config_classifierList: [{id: '0', name: 'waiting to initialize'}],
      config_classifierSelected: {id: '0', name: 'waiting to initialize'},
      config_resultsMode: {id: '0', name: 'Cross-Validation'},
      config_crossvalidationMethods: [{id: '0', name: 'Stratified'}, {id: '1', name: 'Random'}],
      config_crossvalidationMethodSelection: {id: '0', name: 'Stratified'},
      config_crossvalidationNFoldsOptions: [{id: '2', name: '2'}, {id: '3', name: '3'}, {id: '5', name: '5'}, {id: '10', name: '10'}, {id: '25', name: '25'}],
      config_crossvalidationNFoldsSelection: {id: '5', name: '5'},

      results: {},
      results_patientTree: [{text: 'Unknown', nodes: []}],
      results_currentPatient: {text: 'Unknown', nodes: []},
      results_currentNote: {text: [''], date: ''},

      message_title: 'Starting Engine...',
      message_text: 'Please wait a moment.',
      message_showButton: false,
      message_showProgress: true,
      message_buttonText: 'OK',

      serverReady: false,
    };

    this.callbacks = {
      onMain: this.onMain.bind(this),
      onFeatures: this.onFeatures.bind(this),
      onFeaturesTrainingCorpus: this.onFeaturesTrainingCorpus.bind(this),
      onRun: this.onRun.bind(this),
      onExplore: this.onExplore.bind(this),

      onMessage: this.onMessage.bind(this),
      offMessage: this.offMessage.bind(this),
      onMessageOk: this.onMessageOk.bind(this),
      onMessageProgress: this.onMessageProgress.bind(this),

      startFresh: this.startFresh.bind(this),
      loadSession: this.loadSessionFromUi.bind(this),
      saveSession: this.saveSessionFromUi.bind(this),

      loadCorpus: this.loadCorpusFromUi.bind(this),
      loadTestCorpus: this.loadTestCorpusFromUi.bind(this),

      loadKeywords: this.loadKeywordsFromUi.bind(this),
      editKeyword: this.editKeyword.bind(this),
      newKeyword: this.newKeyword.bind(this),
      moveKeyword: this.moveKeyword.bind(this),
      removeKeyword: this.removeKeyword.bind(this),
      saveKeywords: this.saveKeywordsFromUi.bind(this),

      loadFeatures: this.loadFeaturesFromUi.bind(this),
      editFeature: this.editFeature.bind(this),
      newFeature: this.newFeature.bind(this),
      moveFeature: this.moveFeature.bind(this),
      removeFeature: this.removeFeature.bind(this),
      saveFeatures: this.saveFeaturesFromUi.bind(this),

      loadSections: this.loadSectionsFromUi.bind(this),
      editSectionBreaker: this.editSectionBreaker.bind(this),
      newSectionName: this.newSectionName.bind(this),
      moveSectionName: this.moveSectionName.bind(this),
      removeSectionName: this.removeSectionName.bind(this),
      editSectionName: this.editSectionName.bind(this),
      saveSections: this.saveSectionsFromUi.bind(this),

      getNote: this.getNote.bind(this),

      setResultsMode: this.setResultsMode.bind(this),
      setClassifierSelected: this.setClassifierSelected.bind(this),
      setCrossValidationType: this.setCrossValidationType.bind(this),
      setCrossValidationNFolds: this.setCrossValidationNFolds.bind(this),

      trainClassifier: this.trainClassifier.bind(this),
      executeOnTestCorpus: this.executeOnTestCorpus.bind(this),

      executeCrossValidation: this.executeCrossValidation.bind(this),

      exportResults: this.exportResultsFromUi.bind(this),
    };

    ipcRenderer.on('server-started', this.serverLoad.bind(this));
    ipcRenderer.on('server-failed', this.serverFail.bind(this));
  }

  componentDidMount() {
    ipcRenderer.send('server-status');

    this.mounted = true;
    const $ = require('jquery');
    window.jQuery = window.$ = $;
    require('bootstrap');
  }

  // During initialization we will recieve signals from main.js letting us know that python started
  serverLoad() {
    // the python server loaded successfully
    console.log("Python server finished loading.");
    this.setState({serverReady: true});
    if (this.mounted) {
      // we've already mounted, so initialize
      console.log("Initializing from serverLoad");
      this.initialize();
    }
  }
  serverFail() {
    // we failed after n attempts
    console.log("Python server failed!");
    this.onMessage("Engine Failure!", "Failed to connect with Python engine. The application cannot continue. Please contact your system administrator.");
  }


  // The main initialization method called after the app component is mounted and the python server is started
  initialize() {
    // Get the list of possible classifiers
    this.getClassifierList();
    this.getSectionDefaults();

    // Set initial visible state
    const visibleState = this.getVisibleStateFalse();
    visibleState.message = false;
    visibleState.main = true;
    this.setState({ visible: visibleState });

    // If you are loading a corpus from the command line this will take you to a different view
    // Therefore we have to do this after the above
    this.loadCommandLineArguments();
  }

  loadCommandLineArguments() {
    // get the command line arguments from the shared main/render memory space
    const args = require('electron').remote.getGlobal('shared').inputArguments;

    console.log('Welcome to the App');
    if (!isEmpty(args)) {
      // console.log("You gave the input arguments:");
      // console.log(args);

      if (Object.prototype.hasOwnProperty.call(args, 'c')) {
        console.log('Loading the corpus file provided from input arguments:');
        console.log(args.c);
        this.loadCorpusFromFileName(args.c);
        console.log('Finished loading the corpus file.');
      }
      if (Object.prototype.hasOwnProperty.call(args, 'k')) {
        console.log('Loading the keywords file provided from input arguments:');
        console.log(args.k);
        this.loadKeywordsFromFileName(args.k); // Set property to queue loading in features component
        console.log('Finished loading the features file.');
      }
      if (Object.prototype.hasOwnProperty.call(args, 'f')) {
        console.log('Loading the features file provided from input arguments:');
        console.log(args.f);
        this.loadFeaturesFromFileName(args.f); // Set property to queue loading in features component
        console.log('Finished loading the features file.');
      }
    }
  }

  getVisibleStateFalse() {
    return { main: false, message: false, features: false, run: false, explore: false, patient: false };
  }

  onMain() {
    const visibleState = this.getVisibleStateFalse();
    visibleState.main = true;
    this.setState({visible: visibleState});
  }

  onFeatures() {
    if (this.state.finished.trainingCorpus) {
      const visibleState = this.getVisibleStateFalse();
      visibleState.features = true;
      this.setState({ visible: visibleState });
    } else {
      this.onMain();
      this.onMessageOk('Please load a training corpus or session.', 'A training corpus is required before editing the feature definitions.', 'OK');
    }
  }
  onFeaturesTrainingCorpus() {
    if (this.state.finished.trainingCorpus) {
      const visibleState = this.getVisibleStateFalse();
      visibleState.features = true;
      this.setState({ visible: visibleState });
    } else {
      const success = this.loadCorpusFromUi();
      if (success) {
        const visibleState = this.getVisibleStateFalse();
        visibleState.features = true;
        this.setState({ visible: visibleState });
      } else {
        // Sit tight?
      }
    }
  }


  onMessage(title, text) {
    const { visible } = this.state;
    visible.message = true;
    this.setState({ visible, message_title: title, message_text: text, message_showButton: false, message_showProgress: false, message_buttonText: 'OK' });
  }
  onMessageProgress(title, text) {
    const { visible } = this.state;
    visible.message = true;
    this.setState({ visible, message_title: title, message_text: text, message_showButton: false, message_showProgress: true, message_buttonText: 'OK' });
  }
  offMessage() {
    const { visible } = this.state;
    visible.message = false;
    this.setState({ visible });
  }
  onMessageOk(title, text, buttonText) {
    const { visible } = this.state;
    visible.message = true;
    this.setState({ visible, message_title: title, message_text: text, message_showButton: true, message_showProgress: false, message_buttonText: buttonText });
  }

  /* TODO: check if everything is finished, not just corpus. Error if not finished. */
  onRun() {
    if (this.state.finished.features) {
      const visibleState = this.getVisibleStateFalse();
      visibleState.run = true;
      this.setState({ visible: visibleState });
    } else {
      if (this.state.finished.trainingCorpus) {
        this.onFeatures();
        this.onMessageOk('Please provide a valid list of regular expressions.', 'A set of regular expression features is required before editing the algorithm configuration.', 'OK');
      } else {
        this.onMain();
        this.onMessageOk('Please load a training corpus or session.', 'A training corpus is required before editing the algorithm configuration.', 'OK');
      }
    }
  }

  onExplore() {
    if (this.state.finished.crossValResults || this.state.finished.testResults) {
      const visibleState = this.getVisibleStateFalse();
      visibleState.explore = true;
      this.setState({ visible: visibleState });
    } else {
      if (this.state.finished.features) {
        this.onRun();
        this.onMessageOk('Please generate results prior to exploration.', 'Return to algorithm configuration and evaluate a classifier using cross-validation or using a testing corpus.', 'OK');
      } else {
        if (this.state.finished.trainingCorpus) {
          this.onFeatures();
          this.onMessageOk('Please provide a valid list of regular expressions.', 'A set of regular expression features is required before editing the algorithm configuration.', 'OK');
        } else {
          this.onMain();
          this.onMessageOk('Please load a training corpus or session.', 'A training corpus is required before editing the feature definitions.', 'OK');
        }
      }
    }
  }

  onPatientExplore() {
    const visibleState = this.getVisibleStateFalse();
    visibleState.patient = true;
    this.setState({ visible: visibleState });
  }

  getSectionDefaults() {
    APIs.get.sectionDefaults
      .then((data) => {
        this.setState({
          features_sectionsHasBeenModified: false,
          features_sectionNames: data.data.sectionNameData,
          features_sectionBreak: [{regex: data.data.sectionBreakData}],
        });
      })
      .catch((err) => {
        console.log('Couldn\'t get sections', err);
      });
  }

  // Get the list of classifiers - called once at initialize() or on startFresh
  getClassifierList() {
    APIs.get.classifiersList
      .then((data) => {
          this.setState({config_classifierList: data.data, config_classifierSelected: data.data[0]});
          // Also set the selected classifier to the first one in the list
      })
      .catch((err) => {
        console.log('Couldn\'t get classifiers', err);
      });
  }
  // Set the active classifier to a particular entry in the list
  setClassifierSelected(listItem) {
    let { finished } = this.state;
    finished = this.removeAlgorithmResults(finished);

    this.setState({finished, config_classifierSelected: listItem});
  }
  setCrossValidationType(selection) {
    const { finished } = this.state;
    finished.crossValResults = false;

    this.setState({finished, config_crossvalidationMethodSelection: selection});
  }
  setCrossValidationNFolds(selection) {
    // Remove knowledge of cross validation Results
    const { finished } = this.state;
    finished.crossValResults = false;

    this.setState({finished, config_crossvalidationNFoldsSelection: selection});
  }
  setResultsMode(selection) {
    this.setState({config_resultsMode: selection});
  }
  executeCrossValidation() {
    this.onMessageProgress('Cross-Validating Algorithm', 'Please wait...'); // To-do add more context about the algorithm... timing information?

    const postData = {classifierId: this.state.config_classifierSelected.id,
                crossvalidationMethod: this.state.config_crossvalidationMethodSelection.name,
                nFolds: this.state.config_crossvalidationNFoldsSelection.name};

    APIs.post.crossValidate(postData)
      .then((data) => {
        this.offMessage();
        this.executeCrossValidationSuccess(data.data);
      }).catch(() => {
        this.setState({statusText: 'Failed to Cross-Validate Algorithm!'});
        this.onMessageOk('Failed to cross-validate algorithm', 'There was a problem cross-validating the algorithm.', 'OK');
      });
  }

  executeCrossValidationSuccess(data) {
    // change the current visible state to explore
    // var visibleState = this.getVisibleStateFalse();
    // visibleState.explore = true;

    // set state
    const { finished } = this.state;
    finished.crossValResults = true;
    this.setState({results: data, finished, results_patientTree: this.state.corpus_patientTree});
  }

  trainClassifier() {
    this.onMessageProgress('Training Algorithm', 'Please wait...');

    const postData = {classifierId: this.state.config_classifierSelected.id};
    APIs.post.trainClassifier(postData)
      .then(() => {
        const { finished } = this.state;
        finished.trainedClassifier = true;
        finished.testResults = false;

        this.setState({ finished });
        this.offMessage();
      }).catch(() => {
          this.onMessageOk('Failed to train algorithm.', 'There was a problem training the algorithm. This could indiciate an issue with the engine.', 'OK');
      });
  }
  executeOnTestCorpus() {
    this.onMessageProgress('Running Algorithm on Evaluation Corpus', 'Please wait...');
    const postData = {};
    APIs.post.evaluate(postData)
      .then((data) => {
          this.offMessage();
          this.executeOnTestCorpusSuccess(data.data);
      }).catch(() => {
          this.onMessageOk('Failed to evaluate algorithm.', 'There was a problem evaluating the algorithm. This could indiciate an issue with the engine.', 'OK');
      });
  }
  executeOnTestCorpusSuccess(data) {
    // change the current visible state to explore
    // var visibleState = this.getVisibleStateFalse();
    // visibleState.explore = true;

    // set state
    const { finished } = this.state;
    finished.testResults = true;
    this.setState({results: data, finished, results_patientTree: this.state.testCorpus_patientTree});
  }

  initializeState(callbackOnFinished) {
    const newState = {
      visible: {
        main: true,
        message: false,
        features: false,
        run: false,
        explore: false,
        patient: false,
      },
      finished: {
        trainingCorpus: false,
        features: false,
        testCorpus: false,
        trainedClassifier: false,
        testResults: false,
        crossValResults: false,
      },

      statusText: 'Welcome. Please load a corpus.',

      files_corpus: '',
      files_features: '',
      files_keywords: '',
      files_testCorpus: '',

      corpus_patientTree: [{text: 'Unknown', nodes: []}],
      corpus_currentPatient: {text: 'Unknown', nodes: []},
      corpus_currentNote: {text: [''], date: ''},
      corpus_currentNoteMarkup: 'None',

      testCorpus_patientTree: [{text: 'Unknown', nodes: []}],
      testCorpus_currentPatient: {text: 'Unknown', nodes: []},
      testCorpus_currentNote: {text: [''], date: ''},

      features_keywords: [],
      features_keywordsHasBeenEdited: false,
      features_expressions: [],
      features_expressionsHasBeenEdited: false,
      features_sectionNames: [],
      features_sectionBreak: [],
      features_sectionsHasBeenModified: false,

      config_classifierList: [{id: '0', name: 'waiting to initialize'}],
      config_classifierSelected: {id: '0', name: 'waiting to initialize'},
      config_resultsMode: {id: '0', name: 'Cross-Validation'},
      config_crossvalidationMethods: [{id: '0', name: 'Stratified'}, {id: '1', name: 'Random'}],
      config_crossvalidationMethodSelection: {id: '0', name: 'Stratified'},
      config_crossvalidationNFoldsOptions: [{id: '2', name: '2'}, {id: '3', name: '3'}, {id: '5', name: '5'}, {id: '10', name: '10'}, {id: '25', name: '25'}],
      config_crossvalidationNFoldsSelection: {id: '5', name: '5'},

      results: {},
      results_patientTree: [{text: 'Unknown', nodes: []}],
      results_currentPatient: {text: 'Unknown', nodes: []},
      results_currentNote: {text: [''], date: ''},

      message_title: 'Re-Initializing...',
      message_text: 'Please wait a moment.',
      message_showButton: false,
      message_showProgress: true,
      message_buttonText: 'OK',
    };
    this.setState(newState);
    this.getClassifierList();
    this.getSectionDefaults();

    this.initializeStatePython(callbackOnFinished);
  }
  initializeStatePython(callbackOnFinished) {
    // Add initialization method in python
    APIs.get.reset
      .then(() => {
        callbackOnFinished();
      }).catch(() => {
          this.onMessageOk('Failed to re-initialize engine.', 'There was a problem resetting the engine. Please restart the application.', 'OK');
      });
  }
  startFresh() {
    const filenames = this.getCorpusFileNameToLoad();
    if (filenames) {
      const filename = filenames[0];
      this.initializeState(() => {
        const success = this.loadCorpusFromFileName(filename);

        if (success) {
            this.onFeatures();
        } else {
            this.onMain();
        }
      });
    }
  }
  loadSessionFromUi() {
    const filenames = uigetfile({properties: ['openFile'], filters: [{name: 'MRP Session', extensions: ['zip']}], buttonLabel: "Load", title: "Load Session File"});
    if (filenames) {
      this.loadSessionFromFileName(filenames[0]);
    }
  }

  loadSessionFromFileName(filename) {
    if (filename) {
      this.onMessageProgress("Loading Session File", "Please wait...");
      this.initializeState(() => {
          const postData = {path: filename};
          APIs.post.loadSession(postData)
          .then((data) => {
            // We will assume the following:
            // corpus_currentNoteMarkup: 'None',
            // corpus_currentPatient: the first patient (if possible)
            // corpus_currentNote: the first patient (if possible), first note
            // features_keywordsHasBeenEdited: true,
            // features_expressionsHasBeenEdited: true,
            // testCorpus_currentPatient: the first test patient if there is one
            // testCorpus_currentNote: the first patient first note if possible

            // We have also saved all of this extra information
            //  const config = {config_classifierList: this.state.config_classifierList,
            //                  config_classifierSelected: this.state.config_classifierSelected,
            //                  config_crossvalidationMethods: this.state.config_crossvalidationMethods,
            //                  config_crossvalidationMethodSelection: this.state.config_crossvalidationMethodSelection,
            //                  config_crossvalidationNFoldsOptions: this.state.config_crossvalidationNFoldsOptions,
            //                  config_crossvalidationNFoldsSelection: this.state.config_crossvalidationNFoldsSelection};
            //
            //  const postData = {path: filename,
            //                    finished: JSON.stringify(this.state.finished),
            //                    config: JSON.stringify(config)};

            // load the finished notes in the app
            const finished = JSON.parse(data.data.finished);
            const config = JSON.parse(data.data.config);

            // load our keywords and expressions (setState below)
            const features_keywords = data.data.keywords;
            const features_expressions = data.data.expressions;

            const features_keywordsHasBeenEdited = true;
            const features_expressionsHasBeenEdited = true;

            // load corpus
            let corpus_patientTree = data.data.corpus;
            if (!corpus_patientTree) {
              corpus_patientTree = [{text: 'Unknown', nodes: []}];
            }
            // load test corpus
            let testCorpus_patientTree = data.data.testCorpus;
            if (!testCorpus_patientTree) {
              testCorpus_patientTree = [{text: 'Unknown', nodes: []}];
            }

            // Config is a bit more complicated
            // We saved the selected classifier and selected crossVal method
            // If the selections dont match current possibilities we have to abort the results

            const config_classifierSelected  = config.config_classifierSelected;
            const config_resultsMode = config.config_resultsMode;
            const config_crossvalidationMethodSelection = config.config_crossvalidationMethodSelection;
            const config_crossvalidationNFoldsSelection = config.config_crossvalidationNFoldsSelection;

            // Set the config_results mode to match that saved in the file
            // We assume that this will match as only test and cross-validation are possible
            // config_resultsMode: {id: '0', name: 'Cross-Validation'},

            let keepResults = true;
            let results_patientTree = corpus_patientTree;

            // Make sure config_classifierSelected is in the this.state.config_classifierList
            const classifierIsThere = this.state.config_classifierList.reduce((result, item) => result || (item.id === config_classifierSelected.id), false);

            // Make sure config_crossvalidationMethodSelection is in this.state.config_crossvalidationMethods
            const crossValIsThere = this.state.config_crossvalidationMethods.reduce((result, item) => result || (item.id === config_crossvalidationMethodSelection.id), false);

            // Make sure config_crossvalidationNFoldsSelection is in this.state.config_crossvalidationNFoldsOptions
            const nFoldsIsThere = this.state.config_crossvalidationNFoldsOptions.reduce((result, item) => result || (item.id === config_crossvalidationNFoldsSelection.id), false);

            // If we are missing one of the selections that we have made
            // we must abort loading the results
            keepResults = (classifierIsThere && crossValIsThere && nFoldsIsThere);

            let results = {};
            if (keepResults) {
                results = data.data.lastResult;
                if (!results) {
                  results = {};
                }
                if (data.lastResult) {
                  // If you have results you must have a results_patientTree
                  // If you have a testCorpus_patientTree and config is set for testCorpus
                  // Set results_patientTree to be the testCorpus_patientTree
                  // Here we assume that config_resultsMode.id will be 0 or 1 as string 0 for cross-val 1 for testing
                  if (data.data.testCorpus && config_resultsMode.id === '1') {
                    results_patientTree = data.data.testCorpus;
                  }
                  // Otherwise set results_patientTree to corpus_patientTree
                }

                // Set each of the selectors to the corresponding state
                const classifierIndex = this.state.config_classifierList.findIndex(item => item.id === config_classifierSelected.id);
                const crossValIndex = this.state.config_crossvalidationMethods.findIndex(item => item.id === config_crossvalidationMethodSelection.id);
                const nFoldsIndex = this.state.config_crossvalidationNFoldsOptions.findIndex(item => item.id === config_crossvalidationNFoldsSelection.id);

                // Will setting these selections actually set the pulldown properties?
                // How do we do that?
                this.setState({config_classifierSelected: this.state.config_classifierList[classifierIndex],
                               config_crossvalidationMethodSelection: this.state.config_crossvalidationMethods[crossValIndex],
                               config_crossvalidationNFoldsSelection: this.state.config_crossvalidationNFoldsOptions[nFoldsIndex]});
            }

            // Update the state of App
            this.setState({statusText: "Successfully loaded session",
                           finished,
                           features_keywords,
                           features_expressions,
                           features_expressionsHasBeenEdited,
                           features_keywordsHasBeenEdited,
                           corpus_patientTree,
                           testCorpus_patientTree,
                           results,
                           results_patientTree,
                           config_resultsMode,
                           features_sectionNames: data.data.sectionNameData,
                           features_sectionBreak: [{regex: data.data.sectionBreakData}],
                           }, function alsoGetNotes() {
                             console.log("After set data : incoming data");
                             console.log(data);
                             if (data.data.corpus && data.data.corpus.length > 0) {
                               const ptId = data.data.corpus[0].ptId;
                               const noteId = data.data.corpus[0].nodes[0].noteId;
                               console.log("Loading note for training corpus");
                               console.log("Patient " + ptId);
                               console.log("Note " + noteId);
                               this.getNote(ptId, noteId, "None"); // This will load the first patient and the first note
                             }
                             if (data.data.testCorpus && data.data.testCorpus.length > 0) {
                               const test_ptId = data.data.testCorpus[0].ptId;
                               const test_noteId = data.data.testCorpus[0].nodes[0].noteId;
                               this.getNote(test_ptId, test_noteId, "None", 'testing'); // This will load the first patient and the first note
                             }
                           },
                         );

            this.onFeatures();
            this.offMessage();
      }).catch(() => {
        // Raise an alert that we failed and nothing could be done.
        console.log("Failed to load session!");
        this.setState({statusText: "Failed to load session file. Try again."});
        this.onMessageOk("Failed to Load Session File.", `There was a problem loading the session file ${filename}.`, "OK");
      });
      });
    }
  }

  saveSessionFromUi() {
    const filename = uiputfile({filters: [{name: 'MRP Session', extensions: ['zip']}], buttonLabel: "Save", title: "Save Session File"});
    if (filename) {
      this.saveSessionFromFileName(filename);
    }
  }
  saveSessionFromFileName(filename) {
    if (filename) {
      this.onMessageProgress("Saving Session File", "Please wait...");

      // We will assume the following:
      // corpus_currentNoteMarkup: 'None',
      // corpus_currentPatient: the first patient (if possible)
      // corpus_currentNote: the first patient (if possible), first note
      // features_keywordsHasBeenEdited: true,
      // features_expressionsHasBeenEdited: true,
      // testCorpus_currentPatient: the first test patient if there is one
      // testCorpus_currentNote: the first patient first note if possible

      const config = {config_classifierSelected: this.state.config_classifierSelected,
                      config_resultsMode: this.state.config_resultsMode,
                      config_crossvalidationMethodSelection: this.state.config_crossvalidationMethodSelection,
                      config_crossvalidationNFoldsSelection: this.state.config_crossvalidationNFoldsSelection};

      const postData = {path: filename,
                        finished: JSON.stringify(this.state.finished),
                        config: JSON.stringify(config)};

      APIs.post.saveSession(postData)
        .then(() => {
          // Save successful, we are good to go
          this.offMessage();
        }).catch(() => {
          // Raise an alert that we failed and nothing could be done.
          console.log("Failed to save session!");
          this.setState({statusText: "Failed to save session file. Try again."});
          this.onMessageOk("Failed to Save Session File.", `There was a problem saving the file ${filename}.`, "OK");
        });
    }
  }


  exportResultsFromUi() {
    const filename = uiputfile({filters: [{name: 'CSV Files', extensions: ['csv']}], buttonLabel: "Export", title: "Export Results CSV File"});
    if (filename) {
      this.exportResults(filename);
    }
  }
  exportResults(filename) {
    if (filename) {
        this.onMessageProgress("Exporting Results", "Please wait...");

        // download(mainWindow, "http://localhost:5000/results/export")
        //    .then(dl => console.log(dl.getSavePath()))
        //    .catch(console.error);

        const postData = {path: filename};
        APIs.post.exportResults(postData)
          .then(() => {
              this.setState({statusText: "Successfully saved exported results."});
              this.offMessage();
          }).catch(() => {
              // Raise an alert that we failed and nothing could be done.
              console.log("Failed to export results!");
              this.setState({statusText: "Failed to export results to this file."});
              this.onMessageOk("Failed to Export Results.", `There was a problem saving the file ${filename}.`, "OK");
          });
    }
  }

  loadTestCorpusFromUi() {
    const filenames = uigetfile({properties: ['openFile'], filters: [{name: 'JSON', extensions: ['json']}], buttonLabel: "Load", title: "Load Testing Corpus"});
    if (filenames) {
      this.loadTestCorpusFromFileName(filenames[0]);
    }
  }
  loadTestCorpusFromFileName(filename) {
    if (filename) {
      this.onMessageProgress("Loading Test Corpus File", "Please wait...");

      const postData = {path: filename};
      APIs.post.loadTestCorpus(postData)
        .then((data) => {
          // loading succeeded
          const { finished } = this.state;
          finished.testCorpus = true;
          finished.testResults = false;

          // Update the state of App
          this.setState({
            finished, testCorpus_patientTree: data.data, files_testCorpus: filename,
          });

          if (data.length > 0) {
            const ptId = data.data[0].ptId;
            const noteId = data.data[0].nodes[0].noteId;
            this.getNoteTest(ptId, noteId, "None"); // This will load the first patient and the first note
          }

          this.offMessage();
          return true;
        }).catch(() => {
          this.setState({statusText: "Failed to load test corpus. Try again."});
          this.onMessageOk("Failed to load test corpus", `There was a problem loading the corpus file ${filename}.`, "OK");
          return false;
        });
    }
  }

  getCorpusFileNameToLoad() {
    return uigetfile({properties: ['openFile'], filters: [{name: 'JSON', extensions: ['json']}], buttonLabel: "Load", title: "Load Training Corpus"});
  }
  loadCorpusFromUi() {
    const filenames = this.getCorpusFileNameToLoad();
    if (filenames) {
      this.loadCorpusFromFileName(filenames[0]);
    }
  }
  loadCorpusFromFileName(filename) {
    if (filename) {
      this.onMessageProgress("Loading Corpus File", "Please wait...");
      const postData = {path: filename};
      APIs.post.loadCorpus(postData)
        .then((data) => {
          // loading succeeded, so update the status bar and set the corpus browser
          let { finished } = this.state;
          finished.trainingCorpus = true;
          finished = this.removeAlgorithmResults(finished);

          // If you just loaded a corpus you want to be in the features editor
          const visibleState = this.getVisibleStateFalse();
          // visibleState.features = true;
          visibleState.features = true;

          // Update the state of App
          this.setState({statusText: "Successfully loaded a corpus",
                        finished,
                        visible: visibleState,
                        files_corpus: filename,
                        corpus_patientTree: data.data,
                      });
          if (data.data.length > 0) {
            const ptId = data.data[0].ptId;
            const noteId = data.data[0].nodes[0].noteId;
            this.getNote(ptId, noteId, "None"); // This will load the first patient and the first note
          }
          this.offMessage();
          return true;
        }).catch((data) => {
          console.log("Failure response:");
          console.log(data);
          this.setState({statusText: "Failed to load corpus. Try again."});
          this.onMessageOk("Failed to load corpus", `There was a problem loading the corpus file ${filename}.`, "OK");
          return false;
        });
    }
    return false;
  }

  loadFeaturesFromUi() {
    const filenames = uigetfile({properties: ['openFile'], filters: [{name: 'JSON', extensions: ['json']}], buttonLabel: "Load", title: "Load Regular Expressions File"});
    if (filenames) {
      this.loadFeaturesFromFileName(filenames[0]);
    }
  }
  loadFeaturesFromFileName(filename) {
    if (filename) {
      this.onMessageProgress("Loading Regular Expression Library", "Please wait...");

      const postData = {path: filename};
      APIs.post.loadFeatures(postData)
        .then((data) => {
          let { finished } = this.state;
          finished.features = this.checkForValidFeatures(data.data);

          finished = this.removeAlgorithmResults(finished);

          this.setState({finished,
                        files_features: filename,
                        features_expressions: data.data,
                        features_expressionsHasBeenEdited: false,
                        statusText: "Successfully loaded regular expressions."});
          this.refreshCurrentNote();
          this.offMessage();
        }).catch(() => {
          // Raise an alert that we failed and nothing could be done.
          console.log("Failed to load regexp file");
          this.setState({statusText: "Failed to load regular expression library. Try again."});
          this.onMessageOk("Failed to Load Regular Expression Library.", `There was a problem loading the file ${filename}.`, "OK");
        });
    }
  }
  checkForValidFeatures(expressions) {
    return expressions.reduce((prevValid, item) => prevValid || item.isValid, false);
  }

  loadKeywordsFromUi() {
    const filenames = uigetfile({properties: ['openFile'], filters: [{name: 'JSON', extensions: ['json']}], buttonLabel: "Load", title: "Load Keywords Library File"});
    if (filenames) {
      this.loadKeywordsFromFileName(filenames[0]);
    }
  }
  loadKeywordsFromFileName(filename) {
    if (filename) {
      this.onMessageProgress("Loading Keyword Library", "Please wait...");
      const postData = {path: filename};
      APIs.post.loadKeywords(postData)
        .then((data) => {
          let { finished } = this.state;
          finished.features = this.checkForValidFeatures(data.data.expressions);

          finished = this.removeAlgorithmResults(finished);

          this.setState({finished,
                        files_keywords: filename,
                        features_keywords: data.data.keywords,
                        features_expressions: data.data.expressions,
                        features_keywordsHasBeenEdited: false,
                        statusText: "Successfully loaded keyword library."});
          this.refreshCurrentNote();
          this.offMessage();
        }).catch(() => {
          // Raise an alert that we failed and nothing could be done.
          console.log("Failed to load keywords library");
          this.setState({statusText: "Failed to load keyword library. Try again."});
          this.onMessageOk("Failed to Load Keyword Library.", `There was a problem loading the file ${filename}.`, "OK");
        });
    }
  }
  saveKeywordsFromUi() {
    const filename = uiputfile({filters: [{name: 'JSON', extensions: ['json']}], buttonLabel: "Save", title: "Save Keywords Library File"});
    if (filename) {
      this.saveKeywordsFromFileName(filename);
    }
  }
  saveKeywordsFromFileName(filename) {
    if (filename) {
      this.onMessageProgress("Saving Keyword Library", "Please wait...");
      const postData = {path: filename};
      APIs.post.saveKeywords(postData)
        .then(() => {
          this.setState({files_keywords: filename,
                        features_keywordsHasBeenEdited: false,
                        statusText: "Successfully saved keyword library."});
          this.offMessage();
        }).catch(() => {
          // Raise an alert that we failed and nothing could be done.
          console.log("Failed to save keywords library");
          this.setState({statusText: "Failed to save keyword library. Try again."});
          this.onMessageOk("Failed to Save Keyword Library.", `There was a problem saving the file ${filename}.`, "OK");
        });
    }
  }
  saveFeaturesFromUi() {
    const filename = uiputfile({filters: [{name: 'JSON', extensions: ['json']}], buttonLabel: "Save", title: "Save Regular Expressions File"});
    if (filename) {
      this.saveFeaturesFromFileName(filename);
    }
  }
  saveFeaturesFromFileName(filename) {
    if (filename) {
      this.onMessageProgress("Saving Regular Expressions Library", "Please wait...");
      const postData = {path: filename};
      APIs.post.saveFeatures(postData)
        .then(() => {
          this.setState({files_features: filename,
                        features_expressionsHasBeenEdited: false,
                        statusText: "Successfully saved regular expressions file."});
          this.offMessage();
        }).catch(() => {
          // Raise an alert that we failed and nothing could be done.
          console.log("Failed to save keywords library");
          this.setState({statusText: "Failed to save regular expressions file. Try again."});
          this.onMessageOk("Failed to Save Regular Expressions File.", `There was a problem saving the file ${filename}.`, "OK");
        });
    }
  }

  // Request a particular note from the corpus
  getNoteTest(patientId, noteId, noteMarkupIn) {
    this.getNote(patientId, noteId, noteMarkupIn, "testing");
  }
  getNoteResults(patientId, noteId, noteMarkupIn) {
    this.getNote(patientId, noteId, noteMarkupIn, "results");
  }
  getNote(patientId, noteId, noteMarkupIn, corpusSwitchIn) {
    let noteMarkup = noteMarkupIn;
    if (!noteMarkup) {
      noteMarkup = "None"; // sometimes during bootup we get here before the corpus browser is done
    }
    let corpusSwitch = corpusSwitchIn;
    if (!corpusSwitch) {
      corpusSwitch = "training";
    }

    if (patientId === undefined || noteId === undefined) {
      return;
    }

    // Make sure these are valide indecies
    // if (!(this.state.corpus_patientTree.length > (patientIndex) &&
    //   this.state.corpus_patientTree[patientIndex].nodes !== null &&
    //   this.state.corpus_patientTree[patientIndex].nodes.length > (noteIndex) &&
    //   this.state.corpus_patientTree[patientIndex].nodes[noteIndex] !== null
    // )) {
    //   return;
    // }

    let corpusTree;
    switch (corpusSwitch) {
      case "testing":
        corpusTree = this.state.testCorpus_patientTree;
        break;
      case "results":
        corpusTree = this.state.results_patientTree;
        break;
      default:
        corpusTree = this.state.corpus_patientTree;
    }

    // Check to make sure patient actually exists
    const patientIndex = corpusTree.findIndex(item => item.ptId === patientId);
    if (patientIndex == null || patientIndex < 0) {
      // abandon ship
      return;
    }

    const postData = {corpusType: corpusSwitch, patientId, noteId, markupStyle: noteMarkup};

    APIs.post.patientNote(postData)
      .then((data) => {
        // Put the recieved data into the correct variables
        switch (corpusSwitch) {
          case "testing":
            this.setState({testCorpus_currentNote: data.data.note, testCorpus_currentPatient: corpusTree[patientIndex]});
            break;
          case "results":
            this.setState({results_currentNote: data.data.note, results_currentPatient: corpusTree[patientIndex]});
            break;
          default:
            this.setState({corpus_currentNote: data.data.note, corpus_currentPatient: corpusTree[patientIndex], corpus_currentNoteMarkup: noteMarkup});
        }
      }).catch(() => {
        console.log(`Issues getting note for patient ID ${patientId} and note ID ${noteId}`);
      });
  }
  refreshCurrentNote() {
    // refreshCurrentNote always refetches the current training note
    const noteId = this.state.corpus_currentNote.id;
    const patientId = this.state.corpus_currentPatient.ptId;
    const noteMarkup = this.state.corpus_currentNoteMarkup;
    this.getNote(patientId, noteId, noteMarkup, "training");
  }
  newKeyword(rowIdx) {
    APIs.get.newKeyword(rowIdx)
      .then((data) => {
        this.setState({features_keywords: data.data, features_keywordsHasBeenEdited: true});
      }).catch(() => {
        console.log("Communication with server failed.");
    });
  }
  moveKeyword(rowIdx, newIndex) {
    APIs.get.moveKeyword(rowIdx, newIndex)
      .then((data) => {
        this.setState({features_keywords: data.data, features_keywordsHasBeenEdited: true});
      }).catch(() => {
        console.log("Communication with server failed.");
      });
  }
  removeKeyword(rowIdx) {
    APIs.get.removeKeyword(rowIdx)
      .then((data) => {
        // When we edit or remove keywords we must also make sure that the feature_expressions also can componentWillReceiveProps
        // It's possible that if you make a keyword regex invalid any expression that uses that keyword may become invalid
        let { finished } = this.state;
        finished.features = this.checkForValidFeatures(data.data.expressions);

        finished = this.removeAlgorithmResults(finished);

        this.setState({finished, features_keywords: data.data.keywords, features_expressions: data.data.expressions, features_keywordsHasBeenEdited: true});
        this.refreshCurrentNote();
      }).catch(() => {
        console.log("Communication with server failed.");
      });
  }
  editKeyword(rowIdx, row) {
    if (row) {
      // When we edit or remove keywords we must also make sure that the feature_expressions also can componentWillReceiveProps
      // It's possible that if you make a keyword regex invalid any expression that uses that keyword may become invalid
      const postData = Object.assign({}, row);
      postData.index = rowIdx;

      APIs.post.editKeyword(postData)
        .then((data) => {
          let editOccured = true;
          if (data.data[rowIdx] === this.state.features_keywords[rowIdx]) {
            editOccured = false;
          }
          editOccured = editOccured || this.state.features_keywordsHasBeenEdited;

          let { finished } = this.state;
          finished.features = this.checkForValidFeatures(data.data.expressions);

          finished = this.removeAlgorithmResults(finished);

          this.setState({finished, features_keywords: data.data.keywords, features_expressions: data.data.expressions, features_keywordsHasBeenEdited: editOccured});
          this.refreshCurrentNote();
        }).catch(() => {
          console.log("Communication with server failed.");
        });
    }
  }

  newFeature(rowIdx) {
    APIs.get.newFeature(rowIdx)
      .then((data) => {
        this.setState({features_expressions: data.data, features_expressionsHasBeenEdited: true});
      }).catch(() => {
        console.log("Communication with server failed.");
    });
  }
  moveFeature(rowIdx, newIndex) {
    APIs.get.moveFeature(rowIdx, newIndex)
      .then((data) => {
        this.setState({features_expressions: data.data, features_expressionsHasBeenEdited: true});
      }).catch(() => {
        console.log("Communication with server failed.");
      });
  }
  removeFeature(rowIdx) {
    APIs.get.removeFeature(rowIdx)
      .then((data) => {
        let { finished } = this.state;
        finished.features = this.checkForValidFeatures(data.data);

        finished = this.removeAlgorithmResults(finished);

        this.setState({finished, features_expressions: data.data, features_expressionsHasBeenEdited: true});
        this.refreshCurrentNote();
      }).catch(() => {
        console.log("Communication with server failed.");
      });
  }
  editFeature(rowIdx, row) {
    if (row) {
      const postData = {index: rowIdx, name: row.name, regex: row.rawRegex};

      APIs.post.editFeature(postData)
        .then((data) => {
          let editOccured = true;
          if (data[rowIdx] === this.state.features_expressions[rowIdx]) {
            editOccured = false;
          }
          editOccured = editOccured || this.state.features_expressionsHasBeenEdited;

          let { finished } = this.state;
          finished.features = this.checkForValidFeatures(data.data);

          finished = this.removeAlgorithmResults(finished);

          this.setState({finished, features_expressions: data.data, features_expressionsHasBeenEdited: editOccured});
          this.refreshCurrentNote();
        }).catch(() => {
          console.log("Communication with server failed.");
        });
    }
  }

  editSectionBreaker(newRegex) {
    const postData = newRegex;
    APIs.post.editSectionBreaker(postData)
      .then((data) => {
        let editOccured = true;
        if (!(data.data.regex === this.state.features_sectionBreak)) {
          editOccured = false;
        }
        editOccured = editOccured || this.state.features_sectionsHasBeenModified;

        this.setState({features_sectionBreak: [{regex: data.data.regex}],
          features_sectionsHasBeenModified: editOccured});

        this.refreshCurrentNote();
      }).catch(() => {
        console.log("Communication with server failed.");
      });
  }

  sectionNameDataFix(sectionNameData) {
    for (let i = 0; i < sectionNameData.length; i += 1) {
      if (sectionNameData[i].used === "true") {
        sectionNameData[i].useStr = "Yes";
      } else {
        sectionNameData[i].useStr = "No";
      }
    }
    return sectionNameData;
  }

  newSectionName(rowIdx) {
    APIs.get.newSectionName(rowIdx)
      .then((data) => {
        const sectionNameData = this.sectionNameDataFix(data.data.sectionNameData);

        this.setState({features_sectionNames: sectionNameData, features_sectionsHasBeenModified: true});
      }).catch(() => {
        console.log("Communication with server failed.");
      });
  }
  moveSectionName(rowIdx, newIndex) {
    APIs.get.moveSectionName(rowIdx, newIndex)
      .then((data) => {
        const sectionNameData = this.sectionNameDataFix(data.data.sectionNameData);
        this.setState({features_sectionNames: sectionNameData, features_sectionsHasBeenModified: true});
      }).catch(() => {
        console.log("Communication with server failed.");
      });
  }
  removeSectionName(rowIdx) {
    APIs.get.removeSectionName(rowIdx)
      .then((data) => {
        const sectionNameData = this.sectionNameDataFix(data.data.sectionNameData);
        this.setState({features_sectionNames: sectionNameData, features_sectionsHasBeenModified: true});
        this.refreshCurrentNote();
      }).catch(() => {
        console.log("Communication with server failed.");
      });
  }
  editSectionName(rowIdx, row) {
    if (row) {
      const useStr = row.useStr;
      if (useStr === "Yes") {
        row.used = true;
      } else {
        row.used = false;
      }
      // console.log("Incoming edit:")
      // console.log(row)
      const postData = {index: rowIdx, name: row.name, regex: row.rawRegex, use: row.used};

      APIs.post.editSectionName(postData)
        .then((data) => {
          let editOccured = true;
          if (data.data[rowIdx] === this.state.features_sectionNames[rowIdx]) {
            editOccured = false;
          }
          editOccured = editOccured || this.state.features_sectionsHasBeenModified;

          const sectionNameData = this.sectionNameDataFix(data.data.sectionNameData);
          // console.log("Updated data:")
          // console.log(sectionNameData)

          this.setState({features_sectionNames: sectionNameData, features_sectionsHasBeenModified: editOccured});
          this.refreshCurrentNote();
        }).catch(() => {
          console.log("Communication with server failed.");
        });
    }
  }

  loadSectionsFromUi() {
    const filenames = uigetfile({properties: ['openFile'], filters: [{name: 'JSON', extensions: ['json']}], buttonLabel: "Load", title: "Load Sections Definition File"});
    if (filenames) {
      this.loadSectionsFromFileName(filenames[0]);
    }
  }
  loadSectionsFromFileName(filename) {
    if (filename) {
      console.log("Requesting a sections file");
      console.log(filename);
      const postData = {path: filename};
      this.onMessageProgress("Loading Sections Definition File", "Please wait...");
      APIs.post.loadSections(postData)
        .then((data) => {
          console.log(data);
          const sectionNameData = this.sectionNameDataFix(data.data.sectionNameData);
          this.setState({files_sections: filename,
                        features_sectionNames: sectionNameData,
                        features_sectionBreak: [{regex: data.data.sectionBreakData}],
                        features_sectionsHasBeenModified: false,
                        statusText: "Successfully loaded sections definition file."});
          this.refreshCurrentNote();
          this.offMessage();
        }).catch(() => {
          // Raise an alert that we failed and nothing could be done.
          console.log("Failed to load sections definition file");
          this.setState({statusText: "Failed to load sections definition file. Try again."});
          this.onMessageOk("Failed to Load Sections Definition File.", `There was a problem loading the file ${filename}.`, "OK");
        });
    }
  }
  saveSectionsFromUi() {
    const filename = uiputfile({filters: [{name: 'JSON', extensions: ['json']}], buttonLabel: "Save", title: "Save Sections Definition File"});
    if (filename) {
      this.saveSectionsFromFileName(filename);
    }
  }
  saveSectionsFromFileName(filename) {
    if (filename) {
      console.log("Saving a sections definition file");
      console.log(filename);
      this.onMessageProgress("Saving Sections Definitions", "Please wait...");
      const postData = {path: filename};
      APIs.post.saveSections(postData)
        .then(() => {
          this.setState({files_sections: filename,
                        features_sectionsHasBeenModified: false,
                        statusText: "Successfully saved section definitions file."});
          this.offMessage();
        }).catch(() => {
          // Raise an alert that we failed and nothing could be done.
          console.log("Failed to save section definitions");
          this.setState({statusText: "Failed to save section definitions file. Try again."});
          this.onMessageOk("Failed to Save Section Definitions Files.", `There was a problem saving the file ${filename}.`, "OK");
        });
    }
  }

  /* Render the app as a single-page app, with the state visible property defining what is shown. */
  render() {
    // <CorpusBrowser callbacks={this.callbacks} visible={this.state.visible.corpus} corpusLoaded={this.state.finished.corpus} patients={this.state.corpus_patientTree} patient={this.state.corpus_currentPatient} note={this.state.corpus_currentNote}/>
    return (
      <div style={{height: "100%"}}>
        <TopMenu finished={this.state.finished} callbacks={this.callbacks} statusText={this.state.statusText} />
        <Message
          visible={this.state.visible.message}
          callbacks={this.callbacks}
          text={this.state.message_text}
          title={this.state.message_title}
          showButton={this.state.message_showButton}
          showProgress={this.state.message_showProgress}
          buttonText={this.state.message_buttonText}
        />
        <MainMenu finished={this.state.finished} visible={this.state.visible.main} callbacks={this.callbacks} />
        <FeatureEditor
          callbacks={this.callbacks}
          visible={this.state.visible.features}
          patients={this.state.corpus_patientTree}
          patient={this.state.corpus_currentPatient}
          note={this.state.corpus_currentNote}
          features={this.state.features_expressions}
          keywords={this.state.features_keywords}
          keywordsModified={this.state.features_keywordsHasBeenEdited}
          expressionsModified={this.state.features_expressionsHasBeenEdited}
          sectionsModified={this.state.features_sectionsHasBeenModified}
          sectionNameData={this.state.features_sectionNames}
          sectionBreakData={this.state.features_sectionBreak}
        />
        <AlgorithmConfig
          finished={this.state.finished}
          callbacks={this.callbacks}
          visible={this.state.visible.run}
          classifiers={this.state.config_classifierList}
          classifierSelected={this.state.config_classifierSelected}
          crossValidationMethods={this.state.config_crossvalidationMethods}
          crossValidationMethodSelection={this.state.config_crossvalidationMethodSelection}
          crossValidationNFoldsOptions={this.state.config_crossvalidationNFoldsOptions}
          crossValidationNFoldsSelection={this.state.config_crossvalidationNFoldsSelection}
          testPatients={this.state.testCorpus_patientTree}
          testPatient={this.state.testCorpus_currentPatient}
          testNote={this.state.testCorpus_currentNote}
        />
        <Explore
          visible={this.state.visible.explore}
          callbacks={this.callbacks}
          results={this.state.results}
          patients={this.state.results_patientTree}
          patient={this.state.results_currentPatient}
          note={this.state.results_currentNote}
        />
      </div>
    );
  }
}

export default Application;
