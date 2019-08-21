import React from 'react';
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
class D3ManagedCrossFilter extends React.Component {
  constructor(props) {
    super(props);
  }

  /* This is called if the component is going to receive new props, so we check for a few things:
     1. Did this component not have data and is now going to? If so, render a new chart.
     2. Did the data just change? Then we must first remove the chart and then render.
  */
  componentWillReceiveProps(nextProps) {
    if (nextProps.data === undefined || nextProps.data.confs === undefined) {
        // our results array is empty, usually from successive calls to initializeState
        // just remove the chart, but don't render
        return;
    }
    if ((!this.props.data.confs && nextProps.data.confs) || (this.props.data.confs !== nextProps.data.confs)) {
      if (this.props.data.confs && (this.props.data.confs !== nextProps.data.confs)) {
        this.removeChart();
      } else if ((this.props.data.true_conf && nextProps.data.true_conf === undefined)
              || (this.props.data.true_conf === undefined && nextProps.data.true_conf)) {
          // duplicate calls to remove chart mostly for clarity of if expressions
          this.removeChart();
      }
      this.renderChart(nextProps);
    }
  }

  removeChart() {
    CrossFilterController.doRemove();
  }

  renderChart(props) {
    CrossFilterController.doRender(props);
  }

  render() {
    // let hidden = "hidden";
    // if (this.props.visible) {
    //   hidden = "";
    // }
    return (
      <div id="D3CrossFilterContainer" />
    );
  }
}

export default D3ManagedCrossFilter;
