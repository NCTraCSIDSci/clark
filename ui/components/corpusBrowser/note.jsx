import React from 'react';
import {highlight} from './highlight';

// const md = markdown();
const md = require('markdown-it')();

md.core.ruler.after('inline', 'highlight', highlight);

md.renderer.rules.color_open = (tokens, idx) => {
    const color = tokens[idx].content;
    return `<span style="border-radius: 4px; background-color: ${color}; color:black" title="${tokens[idx].attrGet("phrase")}">`;
};

md.renderer.rules.color_text = (tokens, idx) => tokens[idx].content;

md.renderer.rules.color_close = (tokens, idx) => '</span>';

const createMarkup = (text) => {
  const markedUpText = md.render(text);
  return {__html: markedUpText};
};
const Note = (props) => {
  let title = <div />;
  if (props.patientName) {
      title = <div className="large-font">{`${props.patientName} - ${props.noteDate}`}</div>;
  }
  return (
    <div className="note-pad">
      <div dangerouslySetInnerHTML={createMarkup(props.text)} />
    </div>
  );
};

export default Note;
