'use babel';

import React from 'react';
import PatientModal from '../patientModal';
import D3ManagedCrossFilter from './d3ManagedCrossFilter';

// d3.tip = require('d3-tip')(d3);
// require('../tooltip-mixin.js');

class Explore extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      yOffset: 0,
      showModal: false,
      patientInfo: {},
    }; // TODO: Remove yOffset - Don't think this is used anymore
    this.callbacks = {
      showModalView: this.showModalView.bind(this),
      closeModalView: this.closeModalView.bind(this),
    };
    this.onExportButtonClick = this.onExportButtonClick.bind(this);
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   if ((this.state.yOffset !== nextState.yOffset) || (this.props.visible)) return false;
  //   return true;
  // }

  onExportButtonClick() {
    this.props.callbacks.exportResults();
  }

  showModalView(patientInfo) {
    // Translate patientInfo.pt_id to ptID
    const patientIndex = this.props.patients.findIndex(x => x.ptId === patientInfo.pt_id);
    const noteId = this.props.patients[patientIndex].nodes[0].noteId;
    this.setState({ patientInfo, showModal: true }, () => {
      this.props.callbacks.getNote(patientInfo.pt_id, noteId, 'None', "results");
    });

    // This should set app.state.results_currentNote and app.state.results_currentPatient
    // THese are fed to explore.props.patient and explore.props.note
    // These are then fed to patientModal as patient and note
  }

  closeModalView() {
    this.setState({
      patientInfo: {},
      showModal: false,
    });
  }

  render() {
    let hidden = "hidden";
    if (this.props.visible) {
        hidden = "";
        // this.setState({yOffset: ReactDOM.findDOMNode(this).getBoundingClientRect().top});
    }
    // <h3>Experiment ran with stratified k-fold (k=10) cross validation.</h3>
    // <h4>Accuracy: {+this.props.rundata.mean.toFixed(4) * 100}% (+/- {+this.props.rundata.std.toFixed(2)})</h4>

    return (
      <div id="ResultsExplorer" className={`container ${hidden}`}>
        <button type="button" className="page-bounds btn btn-default btn-lg" onClick={this.onExportButtonClick}><span>Export Data</span></button>
        <D3ManagedCrossFilter
          callbacks={this.callbacks}
          data={this.props.results}
          yOffset={0}
          visible={true}
        />
        <PatientModal
          localCallbacks={this.callbacks}
          callbacks={this.props.callbacks}
          showModal={this.state.showModal}
          patientInfo={this.state.patientInfo}
          patients={this.props.patients}
          patient={this.props.patient}
          note={this.props.note}
        />
      </div>
    );
  }
}

// function loadExplore(containerId, data) {
//
//     var margin = {top: 20, right: 20, bottom: 30, left: 40},
//     width = 960 - margin.left - margin.right,
//     height = 500 - margin.top - margin.bottom;
//     ReactDOM.render(<Chart margin={margin} width={width} height={height} data={data}/>, document.getElementById("explore-view"));
//     //d3scatterplot('#explore-view', data.true_conf, data.max_conf, data.true_label);
//     //ReactDOM.render(<Explore data={data}/>, document.getElementById("explore-view"));
// }

export default Explore;
