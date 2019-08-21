import React from 'react';
import { Modal, Button /* Popover, Tooltip, OverlayTrigger */ } from 'react-bootstrap';
import SingleSelectableTable from './corpusBrowser/singleSelectableTable';
import NoteRendererSelector from './corpusBrowser/noteRendererSelector';
import Note from './corpusBrowser/note';
import NoteMetadata from './corpusBrowser/noteMetadata';

class PatientModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedPatientId: "",
      selectedNoteId: "",
      selectedNoteMarkup: 'None',
    };

    this.NoteRendererSelector = null;

    this.onMarkupSelection = this.onMarkupSelection.bind(this);
    this.selectNoteRow = this.selectNoteRow.bind(this);
    this.getNote = this.getNote.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const ptIdSame = nextState.selectedPatientId === this.state.selectedPatientId;
    // if (ptIdSame) {
    //   console.log("Patient is the same")
    // }
    const noteIdSame = nextState.selectedNoteId === this.state.selectedNoteId;
    // if (noteIdSame) {
    //   console.log("Note is the same")
    // }
    const markupSame = nextState.selectedNoteMarkup === this.state.selectedNoteMarkup;
    // if (markupSame) {
    //   console.log("Markup is the same")
    // }
    const ptMatch = nextState.selectedPatientId === nextProps.patient.pt_id;
    // if (ptMatch){
    //   console.log("Patient is the same as before")
    // }

    const doIt = !(ptMatch && ptIdSame && noteIdSame && markupSame);

    return doIt;
  }

  componentDidUpdate() {
    const haveComp = !!(this.NoteRendererSelector);
    let haveFun = false;
    if (haveComp) {
      haveFun = typeof (this.NoteRendererSelector.setSelectionNoCallback) === typeof (Function);
    }
    if (haveComp && haveFun) {
      this.NoteRendererSelector.setSelectionNoCallback(this.state.selectedNoteMarkup);
    }
  }
  // componentWillReceiveProps(newProps) {
  //   //this.setState({currentPatientId: newProps.patient.pt_id})
  // }

  onMarkupSelection(newId, newName) {
      this.setState({selectedNoteMarkup: newName});
      this.getNote(this.state.selectedNoteId, newName);
  }

  getNote(noteRowId, markupStyle) {
      // const noteRowId = this.props.patient.nodes[noteRowIdx].noteId;
      // console.log("Getting note " + this.props.patient.ptId + " " + noteRowId + " " + markupStyle)
      this.props.callbacks.getNote(this.props.patient.ptId, noteRowId, markupStyle, "results");
  }

  selectNoteRow(rowId, rowIdx) {
    this.setState({selectedNoteId: rowId});
    this.getNote(rowId, this.state.selectedNoteMarkup);
  }

  render() {
    // const popover = (
    //   <Popover id="modal-popover" title="popover">
    //     very popover. such engagement
    //   </Popover>
    // );
    // const tooltip = (
    //   <Tooltip id="modal-tooltip">
    //     wow.
    //   </Tooltip>
    // );

    // <div style={{paddingTop:"10px"}}>
    //   <Button onClick={this.props.localCallbacks.closeModalView}>Close</Button>
    // </div>
    // <Modal.Footer>
    //
    // </Modal.Footer>
    let trueLabelFrag = "";
    if (this.props.patientInfo.hasOwnProperty("true_label")) {
      console.log("Found true_label");
      trueLabelFrag = <span><strong>True Label:</strong> {this.props.patientInfo.true_label} <br /></span>;
    }
    return (
      <div>
        <Modal bsSize="large" show={this.props.showModal} onHide={this.props.localCallbacks.closeModalView}>
          <Modal.Header closeButton>
            <Modal.Title>{`${this.props.patientInfo.pt_id} - ${this.props.patientInfo.name}`}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>{this.props.patient.name}</h4>
            <div className="col-md-12 row row-flex" style={{minHeight: "150px", maxHeight: "150px"}} >
              <div id="PatientInfoTable" className="col-md-4">
                <strong>Patient Name:</strong> {this.props.patientInfo.name} <br />
                {trueLabelFrag}
                <strong>Classifier Label:</strong> {this.props.patientInfo.max_label} <br />
              </div>
              <div id="PatientInfoPlots" className="col-md-8" style={{backgroundColor: "#383939", overflowY: "scroll"}}>
                <NoteMetadata note={this.props.note} patient={this.props.patient} />
              </div>
            </div>
            <div className="col-md-12 row row-flex" style={{paddingTop: "15px", height: "calc(95% - 150px)"}}>
              <div id="PatientModelNoteTable" className="col-md-3" style={{height: "100%"}}>
                <SingleSelectableTable data={this.props.patient.nodes} selectedRowCallback={this.selectNoteRow} field={'text'} idField={'noteId'} header={'Notes'} />
              </div>
              <div id="PatientModelNoteViewer" className="col-md-9" style={{height: "100%"}}>
                <div id="PatientModelNoteMarkupSelector" className="row">
                  <NoteRendererSelector ref={(ref) => { this.NoteRendererSelector = ref; }} newSelectionCallback={this.onMarkupSelection} items={["None", "Features", "Sectioning"]} />
                </div>
                <div id="PatientModelNoteText" className="row" style={{height: "calc(100% - 38px)"}}>
                  <div className="scroll-pane">
                    <Note id="PatientModalNote" text={this.props.note.text[0]} patientName={this.props.patient.text} noteDate={this.props.note.date} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{paddingTop: "10px"}}>
              <Button onClick={this.props.localCallbacks.closeModalView} style={{float: "right", marginTop: "10px"}}>Close</Button>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

export default PatientModal;
