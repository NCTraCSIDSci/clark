import React from 'react';
import shortid from 'shortid';
import isValidRegex from './isValidRegex';

const colors = ['rgb(242, 46, 78)', 'rgb(54, 173, 164)', 'rgb(220, 137, 50)', 'rgb(174, 157, 49)', 'rgb(119, 171, 49)', 'rgb(51, 176, 122)', 'rgb(56, 169, 197)', 'rgb(110, 155, 244)', 'rgb(204, 122, 244)', 'rgb(245, 101, 204)'];

function addSections(sectionBreak, text) {
  if (text) {
    if (!isValidRegex(sectionBreak)) return [text];
    // if (!expressions.length || (expressions.length === 1 && !expressions[0].regex)) return text;
    const highlightedText = [];
    const allMatches = [];
    const reg = new RegExp(sectionBreak, 'gi');
    const matches = []; // matches is an interable object, needs to be an array
    let m;
    while (m = reg.exec(text)) { // eslint-disable-line no-cond-assign
      matches.push({
        0: m[0], index: m.index,
      });
      reg.lastIndex = m.index + 1;
    }
    allMatches.push(...matches);
    if (!allMatches.length) return [text]; // if there are no matches, return text
    let index = 0;
    highlightedText.push(
      <span key={shortid.generate()}>
        {text.slice(0, allMatches[0].index)}
      </span>,
    );
    const len = allMatches.length;
    for (let i = 0; i < len - 1; i += 1) {
      // we need access to the index of the next match to know when to stop the section
      index += 1;
      const color = colors[index % colors.length];
      highlightedText.push(
        <div key={shortid.generate()} style={{ margin: '10px 0px', borderLeft: `2px solid ${color}` }}>
          {text.slice(allMatches[i].index, allMatches[i + 1].index)}
        </div>,
      );
    }
    index += 1;
    const color = colors[index % colors.length];
    highlightedText.push(
      <div key={shortid.generate()} style={{ margin: '10px 0px', borderLeft: `2px solid ${color}` }}>
        {text.slice(allMatches[len - 1].index)}
      </div>,
    );
    return highlightedText;
  }
  return ['Please select a note to view.'];
}

export default addSections;
