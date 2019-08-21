import React from 'react';

class NoteMetadata extends React.Component {
  constructor(props) {
    super(props);
    this.blacklist = ["noteType", "noteCount", "noteId", "note", "noteSeq", "externalId", "text", "nodes", "state"];
    this.special = ["metadata"];
  }

  renderMetadata(object) {
    const topMetadata = Object.keys(object).map((key, i) => {
      if (!this.blacklist.includes(key) && !this.special.includes(key)) {
        return (
          <div key={`notePatientTopMeta${key}`}>{key}: {object[key]}</div>
        );
      }
      return <div key={`notePatientTopMeta${i}`} />;
    });

    let meta;
    if (Object.prototype.hasOwnProperty.call(object, "metadata")) {
      meta = Object.keys(object.metadata).map(key => <div key={`notePatientMeta${key}`}>{key}: {object.metadata[key]}</div>);
    }

    return { topMeta: topMetadata, meta };
  }

  render() {
    const patientMeta = this.renderMetadata(this.props.patient);
    const noteMeta = this.renderMetadata(this.props.note);
    return (
      <div className="note-pad">
        <h2>Metadata</h2>
        {patientMeta.topMeta}
        {patientMeta.meta}
        {noteMeta.topMeta}
        {noteMeta.meta}
        <hr />
      </div>
    );
  }
}

export default NoteMetadata;
