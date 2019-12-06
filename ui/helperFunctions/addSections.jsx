import React from 'react';
import shortid from 'shortid';
import isValidRegex from './isValidRegex';

const headerColor = 'rgb(198, 198, 198)';
const unnamedColor = 'rgb(99, 190, 255)';

function addSections(sectionBreak, validRegex, text) {
  if (text) {
    if (!isValidRegex(sectionBreak)) {
      return [
        <div key={shortid.generate()}>
          {text}
        </div>,
      ];
    }
    const highlightedText = [];
    let reg = new RegExp(sectionBreak, 'gi');
    let matches = text.matchAll(reg);
    matches = [...matches]; // matches is an interable object, needs to be an array
    if (!matches.length) { // if there are no matches, return text
      return [
        <div
          key={shortid.generate()}
          style={{ borderLeft: `2px solid ${headerColor}` }}
        >
          {text}
        </div>,
      ];
    }
    const breakPoints = [];
    const sections = [{ start: 0, color: headerColor }];
    matches.forEach((match) => {
      breakPoints.push(match.index); // keep track of where each match starts
      const section = { start: match.index };
      validRegex.forEach((regex) => {
        reg = new RegExp(regex.regex, 'gi');
        if (reg.test(match[0])) {
          // TODO: this should probably work with more than one color
          section.color = regex.color; // if a regex matches, give the section that color
        }
      });
      sections.push(section);
    });
    breakPoints.forEach((breakpoint, i) => {
      sections[i].stop = breakpoint; // the section stop is the next section's start
      // the last section's stop will be undefined
    });
    sections.forEach((section) => {
      highlightedText.push(
        <div
          key={shortid.generate()}
          style={{
            margin: '10px 0px',
            borderLeft: `2px solid ${section.color || unnamedColor}`,
          }}
        >
          {text.slice(section.start, section.stop)}
        </div>,
      );
    });
    return highlightedText;
  }
  return ['Please select a note to view.'];
}

export default addSections;
