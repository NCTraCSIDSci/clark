// https://stackoverflow.com/a/42095319
import React from 'react';
import getCombinedColor from './getCombinedColor';

function innerHighlight(allMatches) {
  let breakPoints = [];
  const ranges = [];
  const flattenedRanges = [];
  allMatches.forEach((match) => {
    const stop = match.index + match[0].length;
    const { name, color, index } = match;
    ranges.push({
      name, color, start: index, stop,
    });
    breakPoints.push(index, stop);
  });
  breakPoints = breakPoints.sort((a, b) => a - b);
  for (let i = 0; i < breakPoints.length; i += 1) {
    if (i !== 0 && breakPoints[i] !== breakPoints[i - 1]) {
      const includedBreaks = ranges.filter((match) => ( // find ranges that encompass this breakpoint
        Math.max(match.start, breakPoints[i - 1]) < Math.min(match.stop, breakPoints[i])
      ));
      if (includedBreaks.length > 0) { // if the breakpoint is in a range
        const color = getCombinedColor(includedBreaks.map((x) => x.color));
        const flattenedBreak = {
          start: breakPoints[i - 1],
          stop: breakPoints[i],
          color,
          tooltip: [],
        };
        includedBreaks.forEach((x) => {
          flattenedBreak.tooltip.push(x.name);
        });
        flattenedRanges.push(flattenedBreak);
      }
    }
  }
  return flattenedRanges;
}

function addNonHighlight(ranges, length) {
  const inflated = [];
  let lastIndex;
  for (let i = 0; i < ranges.length; i += 1) {
    if (i === 0) {
      if (ranges[i].start > 0) {
        inflated.push({
          start: 0,
          stop: ranges[i].start,
        });
      }
      inflated.push(ranges[i]);
    } else {
      if (ranges[i].start - ranges[i - 1].stop > 1) {
        inflated.push({
          start: ranges[i - 1].stop,
          stop: ranges[i].start,
        });
      }
      inflated.push(ranges[i]);
    }
    lastIndex = ranges[i].stop;
  }
  if (lastIndex < length - 1) {
    inflated.push({
      start: lastIndex,
      stop: length - 1,
    });
  }
  return inflated;
}

function highlight(text, expressions) {
  if (text) {
    if (!expressions || !expressions.length || (expressions.length === 1 && !expressions[0].regex)) return [text];
    const highlightedText = [];
    const allMatches = [];
    expressions.forEach((regex) => {
      const reg = new RegExp(regex.compiled || regex.regex, 'gi');
      const matches = []; // matches is an interable object, needs to be an array
      let m;
      while (m = reg.exec(text)) { // eslint-disable-line no-cond-assign
        matches.push({
          0: m[0], index: m.index, color: regex.color, name: regex.name,
        });
        reg.lastIndex = m.index + 1;
      }
      allMatches.push(...matches);
    });
    if (!allMatches.length) return [text]; // if there are no matches, return text
    const highlightedRanges = innerHighlight(allMatches);
    const completeRanges = addNonHighlight(highlightedRanges, text.length);
    completeRanges.forEach((range, i) => {
      if (range.color) {
        const tooltip = range.tooltip.join(', ');
        const backgroundColor = range.color;
        highlightedText.push(
          <div key={i} style={{ backgroundColor, display: 'inline-block' }} data-md-tooltip={tooltip}>
            {text.substring(range.start, range.stop)}
          </div>,
        );
      } else {
        highlightedText.push(
          <span key={i}>{text.substring(range.start, range.stop)}</span>,
        );
      }
    });
    return highlightedText;
  }
  return ['Please select a note to view.'];
}

export default highlight;
