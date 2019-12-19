import React, { useState, useEffect } from 'react';
import CrossFilterController from './crossFilterController';

/* Chart component that embeds a d3 plot but keeps the two dom elements separate. Does so by creating
   a DOM element in React, then getting that element id and passing it to D3. Data updates and performed by completely
   re-creating the SVG element for now.

   In other words, the Chart component just passes the objects it receives to the D3 drawing functions.

   brettwalenz note: There are a lot of ways to possibly do this, I chose the most abstracted but hopefully easiest way.
   I stole the idea from: http://nicolashery.com/integrating-d3js-visualizations-in-a-react-app/

   There were a lot of ideas for "integrating React and d3 the right way", by making SVG elements into React elements, but
   I would avoid those as that is overly complex and detailed.
*/
function D3ManagedCrossFilter(props) {
  const {
    data, patientDetails,
  } = props;

  function removeChart() {
    CrossFilterController.doRemove();
  }

  function renderChart(newProps) {
    CrossFilterController.doRender(newProps, patientDetails);
  }

  useEffect(() => {
    if (!Object.keys(data).length || data.confs === undefined) {
      // our results array is empty, usually from successive calls to initializeState
      // just remove the chart, but don't render
      removeChart();
    } else {
      renderChart(data);
    }
  }, [data]);

  return (
    <div id="D3CrossFilterContainer" />
  );
}

export default D3ManagedCrossFilter;
