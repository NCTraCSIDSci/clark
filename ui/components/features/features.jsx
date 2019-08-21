import React from 'react';

import FeatureEditorAccordion from './featureEditorAccordion';
import AccordionItem from './accordionItem';
import KeywordEditorTable from './keywordEditorTable';
import FeatureEditorTable from './featureEditorTable';
import SectionEditor from './sectionEditor/sectionEditor';
import CorpusBrowser from '../corpusBrowser/corpusBrowser';

function columnWidthChildFix(caller) {
  // Here we are making use of string refs
  // This may be deprecated in future versions of react
  try {
      caller.refs.child.resizeColumns();
  } finally {
    // Don't worry about it
  }
}

function columnWidthChildFixSection(caller) {
  // Here we are making use of string refs
  // This may be deprecated in future versions of react
  try {
      caller.refs.child.break.resizeColumns();
  } finally {
    // Don't worry about it
  }
  try {
    caller.refs.child.name.resizeColumns();
  } finally {
    // Dont worry about it
  }
}

/* FeatureEditorView consists of an accordion-style menu on the left, and a Note display field on
the right. It's capable of loading itself: TreeView loads from server, and Keyword RegexList and Feature Expression RegexList can be loaded from file.
*/
const FeatureEditor = (props) => {
  const { callbacks, keywords, features, sectionNameData, sectionBreakData } = props;
  let hidden = "hidden";
  if (props.visible) {
    hidden = "";
  }
  // <h3>Configure feature expressions and keywords</h3>
  // <h5>Load keywords from files, then feature expressions</h5>

  // Section editing needs load and save loadable={props.callbacks.loadCorpus} count={props.keywords.length}
  return (
    <div id="Features" className={`col-md-12 ${hidden}`} style={{height: "100%"}}>
      <div className={"page-bounds"} />
      <div id="FeaturesAccordion" className="col-md-3" style={{paddingLeft: 0, paddingRight: 0, marginLeft: 0, marginRight: 0}}>
        <FeatureEditorAccordion>
          <div className={"large-font"}>Algorithm Setup</div>
          <AccordionItem heading={"Training Corpus"} loadable={callbacks.loadCorpus} count={props.patients.length}>
            <div>
              <ul>
                <li>Number of Patients: {props.patients.length}</li>
              </ul>
            </div>
          </AccordionItem>
          <AccordionItem onDisplay={columnWidthChildFix} heading={"Regular Expressions Library"} loadable={callbacks.loadKeywords} saveable={callbacks.saveKeywords} disableSave={keywords.length === 0} isNotModified={!props.keywordsModified} count={keywords.length}>
            <KeywordEditorTable callbacks={callbacks} data={keywords} />
          </AccordionItem>
          <AccordionItem onDisplay={columnWidthChildFix} heading={"Active Regular Expressions"} loadable={callbacks.loadFeatures} saveable={callbacks.saveFeatures} disableSave={features.length === 0} isNotModified={!props.expressionsModified} count={features.length}>
            <FeatureEditorTable callbacks={callbacks} data={features} />
          </AccordionItem>
          <AccordionItem onDisplay={columnWidthChildFixSection} heading={"Section Definitions"} loadable={callbacks.loadSections} saveable={callbacks.saveSections} disableSave={false} isNotModified={!props.sectionsModified}>
            <SectionEditor callbacks={callbacks} sectionNameData={sectionNameData} sectionBreakData={sectionBreakData} />
          </AccordionItem>
        </FeatureEditorAccordion>
      </div>
      <div id="FeaturesCorpusBrowser" className="col-md-9" style={{height: "calc(100% - 75px)", paddingLeft: 0, paddingRight: 0}}>
        <CorpusBrowser callbacks={callbacks} visible={props.visible} header={"Training Corpus"} corpusId={"training"} patients={props.patients} patient={props.patient} note={props.note} />
      </div>
    </div>
  );
};

export default FeatureEditor;
