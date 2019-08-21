import React from 'react';
import Dropdown from './dropdown';
import CorpusBrowser from './corpusBrowser/corpusBrowser';

class AlgorithmConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      evaluationMetrics: [
        {id: '0', name: "Cross-Validation"},
        {id: '1', name: "Evaluation Corpus"},
      ],
      selectedEvaluationMetric: {id: '0', name: "Cross-Validation"},
    };

    this.onCrossValButtonClick = this.onCrossValButtonClick.bind(this);
    this.onClassifierSelected = this.onClassifierSelected.bind(this);
    this.onEvaluationMethodSelected = this.onEvaluationMethodSelected.bind(this);
    this.onCrossValNFoldsSelected = this.onCrossValNFoldsSelected.bind(this);
    this.onCrossValTypeSelected = this.onCrossValTypeSelected.bind(this);
  }

  onCrossValButtonClick() {
      this.props.callbacks.executeCrossValidation();
  }
  onCrossValTypeSelected(event) {
    const selected = { id: event.target.id, name: event.target.text };
    this.props.callbacks.setCrossValidationType(selected);
  }
  onCrossValNFoldsSelected(event) {
    const selected = { id: event.target.id, name: event.target.text };
    this.props.callbacks.setCrossValidationNFolds(selected);
  }

  onClassifierSelected(event) {
    const selected = { id: event.target.id, name: event.target.text };
    this.props.callbacks.setClassifierSelected(selected);
  }
  onEvaluationMethodSelected(event) {
    const selected = { id: event.target.id, name: event.target.text };
    this.setState({selectedEvaluationMetric: selected});
    this.props.callbacks.setResultsMode(selected);
  }

  render() {
    let hidden = "hidden";
    if (this.props.visible) {
        hidden = "";
    }
    let testCorpusHidden = "hidden";
    let crossValHidden = "hidden";
    if (this.state.selectedEvaluationMetric.name === "Cross-Validation") {
      crossValHidden = "";
    } else {
      testCorpusHidden = "";
    }

    let crossvalExploreDisabled = {disabled: "disabled"};
    let crossvalCanExploreArrowColor = "";
    if (this.props.finished.crossValResults) {
      crossvalExploreDisabled = {};
      crossvalCanExploreArrowColor = "green-text";
    }

    let trainDisabled = {disabled: "disabled"};
    if (this.props.finished.features && this.props.finished.trainingCorpus) {
        trainDisabled = {};
    }

    let testingCorpusHidden = "hidden";
    if (this.props.finished.testCorpus && this.props.testPatients && this.props.testPatients[0].nodes.length > 0) {
      testingCorpusHidden = "";
    }

    let testCanTrainArrowColor = "";
    trainDisabled = {disabled: "disabled"};
    if (this.props.finished.testCorpus) {
      trainDisabled = {};
      testCanTrainArrowColor = "green-text";
    }

    let runOnTestDisabled = {disabled: "disabled"};
    let testCanEvalArrowColor = "";
    if (this.props.finished.trainedClassifier) {
      runOnTestDisabled = {};
      testCanEvalArrowColor = "green-text";
    }

    let exploreTestDisabled = {disabled: "disabled"};
    let testCanExploreArrowColor = "";
    if (this.props.finished.testResults) {
      exploreTestDisabled = {};
      testCanExploreArrowColor = "green-text";
    }


    return (
      <div id="AlgorithmConfig" className={`full-height page-bounds col-md-12 ${hidden}`} >
        <div className="row">
          <div className="col-md-12 algorithmConfigBoxTop">
            <h3>Configure a Classifier and Evaluation Method</h3>
            <div className="col-md-12">
              <div className="row" style={{marginLeft: "15px", paddingBottom: "10px"}}>
                <div className="col-md-2" style={{fontSize: "16px", padding: "5px"}}>Algorithm</div><div className="col-md-10"><Dropdown id="classifierDrop" items={this.props.classifiers} onSelect={this.onClassifierSelected} selected={this.props.classifierSelected} /></div>
              </div>
              <div className="row" style={{marginLeft: "15px", paddingBottom: "10px"}}>
                <div className="col-md-2" style={{fontSize: "16px", padding: "5px"}}>Evaluation Method</div><div className="col-md-10"><Dropdown id="evalMethodDrop" items={this.state.evaluationMetrics} onSelect={this.onEvaluationMethodSelected} selected={this.state.selectedEvaluationMetric} /></div>
              </div>
            </div>
          </div>
          <div className={`col-md-12 algorithmConfigBoxTop ${crossValHidden}`}>
            <h3>Cross-Validation on Training Corpus</h3>
            <div className="col-md-12">
              <div className="row" style={{marginLeft: "15px", paddingBottom: "10px"}}>
                <div className="col-md-2" style={{fontSize: "16px", padding: "5px"}}>Cross-Validation Method</div>
                <div className="col-md-10"><Dropdown id="xvalTypeDrop" items={this.props.crossValidationMethods} onSelect={this.onCrossValTypeSelected} selected={this.props.crossValidationMethodSelection} /></div>
              </div>
              <div className="row" style={{marginLeft: "15px", paddingBottom: "10px"}}>
                <div className="col-md-2" style={{fontSize: "16px", padding: "5px"}}>Number of Folds</div>
                <div className="col-md-10"><Dropdown id="xvalFoldsDrop" items={this.props.crossValidationNFoldsOptions} onSelect={this.onCrossValNFoldsSelected} selected={this.props.crossValidationNFoldsSelection} /></div>
              </div>
            </div>

            <div className="col-md-12">
              <div className="progressionButtonContainer" style={{marginLeft: "15px"}}>
                <div className="col-md-2" />
                <div className="col-md-10">
                  <button type="button" className="btn btn-default btn-lg" onClick={this.onCrossValButtonClick}>
                    <span>Cross<br />Validate</span>
                  </button>
                  <span className="arrowContainer" style={{padding: "0 20px"}}>
                    <span className={`glyphicon glyphicon-arrow-right ${crossvalCanExploreArrowColor}`} />
                  </span>
                  <button type="button" className="btn btn-default btn-lg" {...crossvalExploreDisabled} onClick={this.props.callbacks.onExplore}>
                    Explore<br />Results
                  </button>
                </div>
              </div>
            </div>{/* End configBoxTop */}
          </div>{/* End row */}
        </div>

        <div className={`row ${testCorpusHidden} full-height`}>
          <div className="algorithmConfigBoxBottom full-height">
            <div className="col-md-12">
              <h4>Run Algorithm on an Evaluation Corpus</h4>
              <div className="col-md-12">
                <div className="progressionButtonContainer">
                  <button type="button" className="btn btn-default btn-lg" onClick={this.props.callbacks.loadTestCorpus}>
                    <span>Load Evaluation Corpus</span>
                  </button>
                  <span className="arrowContainer" style={{padding: "0 20px"}}>
                    <span className={`glyphicon glyphicon-arrow-right ${testCanTrainArrowColor}`} />
                  </span>
                  <button type="button" className="btn btn-default btn-lg" {...trainDisabled} onClick={this.props.callbacks.trainClassifier}>
                    <span>Train Algorithm</span>
                  </button>
                  <span className="arrowContainer" style={{padding: "0 20px"}}>
                    <span className={`glyphicon glyphicon-arrow-right ${testCanEvalArrowColor}`} />
                  </span>
                  <button type="button" className="btn btn-default btn-lg" {...runOnTestDisabled} onClick={this.props.callbacks.executeOnTestCorpus}>
                    <span>Run Algorithm</span>
                  </button>
                  <span className="arrowContainer" style={{padding: "0 20px"}}>
                    <span className={`glyphicon glyphicon-arrow-right ${testCanExploreArrowColor}`} />
                  </span>
                  <button type="button" className="btn btn-default btn-lg" {...exploreTestDisabled} onClick={this.props.callbacks.onExplore}>
                    <span>Explore Results</span>
                  </button>
                </div>
              </div>
            </div>
            <div className={`full-height col-md-12 ${testingCorpusHidden}`} style={{minHeight: "350px"}}>
              <CorpusBrowser callbacks={this.props.callbacks} visible={this.props.visible} header={"Evaluation Data"} corpusId={"testing"} patients={this.props.testPatients} patient={this.props.testPatient} note={this.props.testNote} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}


export default AlgorithmConfig;
