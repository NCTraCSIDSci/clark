import React from 'react';

import SectionBreakEditor from './sectionBreakEditor';
import SectionNameEditorTable from './sectionNameEditorTable';

class SectionEditor extends React.Component {
  constructor(props) {
    super(props);

    this.break = null;
    this.name = null;
    // callbacks={this.props.callbacks}
    // sectionNameData={this.props.sectionNameData}
    // sectionBreakData={this.props.sectionBreakData}
  }

  render() {
    return (
      <div>
        <SectionBreakEditor ref={(ref) => { this.break = ref; }} callbacks={this.props.callbacks} data={this.props.sectionBreakData} />
        <SectionNameEditorTable ref={(ref) => { this.name = ref; }} callbacks={this.props.callbacks} data={this.props.sectionNameData} />
      </div>
    );
  }
}

export default SectionEditor;
