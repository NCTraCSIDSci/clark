import React from 'react';
// import ReactDataGrid from 'react-data-grid';
// import Dropdown from '../dropdown';

import SingleSelectableTable from './singleSelectableTable';
import Note from './note';
import NoteMetadata from './noteMetadata';
import NoteRendererSelector from './noteRendererSelector';

// const { Row } = ReactDataGrid;

// var Remarkable = require('remarkable');
// var md = new Remarkable();

class CorpusBrowser extends React.Component {
  constructor(props) {
    super(props);
    // callbacks={this.callbacks}
    // visible={this.state.visible.corpus}
    // patients={this.state.corpus_patientTree}
    // patient={this.state.corpus_currentPatient}
    // note={this.state.corpus_currentNote}
    this.state = {
      selectedPatientRow: 0,
      selectedNoteRow: 1,
      noteMarkupStyleList: [
        {id: 0, name: "None"},
        {id: 1, name: "Features"},
        {id: 2, name: "Sectioning"},
      ],
      noteMarkupSelected: {id: 0, name: "None"},
    };
    this.selectRow = this.selectRow.bind(this);
    this.selectNoteRow = this.selectNoteRow.bind(this);
    this.onMarkupSelection = this.onMarkupSelection.bind(this);
  }

  onMarkupSelection(newId, newName) {
      this.setState({noteMarkupSelected: {id: newId, name: newName}});
      this.getNote(this.state.selectedPatientRow, this.state.selectedNoteRow, newName);
  }

  selectRow(patientId, patientIndex) {
    // For this patiendId we should select the id of the first note
    let firstNoteId = 1;
    if ((patientIndex || patientIndex === 0) && patientIndex !== null && patientIndex >= 0) {
      // console.log(this.props.patients[patientIndex])
      if (this.props.patients[patientIndex] && this.props.patients[patientIndex].nodes) {
        const notes = this.props.patients[patientIndex].nodes;
        firstNoteId = notes[0].noteId;
      }
    }

    this.setState({selectedPatientRow: patientId, selectedNoteRow: firstNoteId});
    this.getNote(patientId, firstNoteId, this.state.noteMarkupSelected.name);
  }

  selectNoteRow(rowId, rowIdx) {
    this.setState({selectedNoteRow: rowId});
    this.getNote(this.state.selectedPatientRow, rowId, this.state.noteMarkupSelected.name);
  }

  getNote(patientRowId, noteRowId, markupStyle) {
      // We can't assume that this.state is up to date with the most recent props.
      // Originally i tried getNote() and the call below to the app.getNote() would just read this.state
      // However in the calls above the setState() which updates the state may not have been completed by the time you get here
      // Therefore each fo the calls below call this function be explicitly stating the freshest info without depending on the react update.
      this.props.callbacks.getNote(patientRowId, noteRowId, markupStyle, this.props.corpusId); // This will update app.corpus_currentPatient => patient
  }

  render() {
    let hidden = "hidden";
    if (this.props.visible) {
      hidden = "";
    }
    return (
      <div id="CorpusBrowser" className={`col-md-12 ${hidden}`} style={{height: "100%", paddingLeft: 0, paddingRight: 0}}>
        <div id="CorpusBrowserTables" className={"col-md-4"} style={{height: "100%"}}>
          <div className="large-font">{this.props.header} <span className="badge badge-pill badge-primary">{this.props.patients.length}</span></div>
          <div id="CorpusBrowserPatientsTable" className="col-md-6" style={{height: "90%", margin: 0, padding: 0}}>
            <SingleSelectableTable data={this.props.patients} selectedRowCallback={this.selectRow} field={'text'} idField={'ptId'} header={'Patients'} />
          </div>
          <div id="CorpusBrowserPatientNoteTable" className="col-md-6" style={{height: "90%", margin: 0, padding: 0}}>
            <SingleSelectableTable data={this.props.patient.nodes} selectedRowCallback={this.selectNoteRow} field={'text'} idField={'noteId'} header={'Notes'} />
          </div>
        </div>
        <div id="CorpusBrowserNote" className="col-md-8" style={{height: "100%"}}>
          <div className="large-font row">{"Note with additional markup"}</div>
          <div id="CorpusBrowserNoteMarkupSelector" className="row" >
            <NoteRendererSelector newSelectionCallback={this.onMarkupSelection} items={["None", "Features", "Sectioning"]} />
          </div>
          <div id="CorpusBrowserNoteText" className="row note" style={{height: "calc(90% - 38px)"}}>
            <div className="scroll-pane">
              <NoteMetadata note={this.props.note} patient={this.props.patient} />
              <Note id="CorpusBrowserNote" text={this.props.note.text[0]} patientName={this.props.patient.text} noteDate={this.props.note.date} />
            </div>
          </div>

        </div>
      </div>
    );
  }
}

export default CorpusBrowser;
