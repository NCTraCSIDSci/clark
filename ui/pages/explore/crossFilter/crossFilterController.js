import * as d3 from 'd3';
import dc from 'dc';
import crossfilter from 'crossfilter2';

import restructureJson from './restructureJson';
import getScreenBBox from './getScreenBBox';

dc.config.defaultColors(d3.schemePaired);

// Object for holding methods to hold and manage the d3 code
const CrossFilterController = {
  doRemove: () => {
    d3.select('#D3CrossFilterContainer').selectAll('*').remove();
  },
  doRender: (props, patientDetails) => {
    const outerContainer = d3.select('#D3CrossFilterContainer'); //  Must match above
    //  .append('div')
    //    .classed('container', true); // Container for full dashboard

    outerContainer.append('div').attr('id', 'tooltip')
      .html('<span id="keyVal"></span><span> : </span><span id="valueVal"></span>');

    // Title + Global Reset control for all filters
    outerContainer.append('div').attr('id', 'PerformanceExplorer')
      .html(`
        <div class="dc-data-count dc-chart col-md-12">
          <h2>Performance Explorer : 
            <span>
              <span class="filter-count"></span> 
              selected out of 
              <span class="total-count"></span> 
              records 
              <button
                id="crossFilterGlobalReset"
                class="d3Button"
              >
                  Reset All
              </button>
            </span>
          </h2>
        </div>`);

    // NOTE: Currently unused. Placeholder for stacked bar-chart view
    outerContainer.append('div').classed('row', true).html('<div class="col-md-12" id="dc-stacked-barchart"><!-- <h4>Stacked Bar Chart for True Labels</h4> --></div>');

    // <div class='row' id='DCChartData'>
    //  <div class='panel panel-default' id='panel-default'>\
    //   <div class='panel-body'>\
    const panelBodyContainer = outerContainer
      .append('div')
      .attr('id', 'DCChartData');

    const noTruth = props.true_label === undefined;
    if (!noTruth) {
      // Top row of charts (trueLabel row chart, Classifier Label row chart & pie chart)
      panelBodyContainer.append('div').classed('row', true).html(`
        <div class="col-md-4 dc-chart" id="dc-truelabel-chart">
          <h4>
            Distribution by True Class Labels
            <span>
              <a
                class="reset d3Button"
                href="javascript:void(0);"
                style="display: none;"
              >
                Reset
              </a>
            </span>
          </h4>
        </div>
        <div class="col-md-4 dc-chart" id="dc-classifierlabel-chart">
          <h4>
            Distribution by Classifier Labels
            <span>
              <a
                class="reset d3Button"
                href="javascript:void(0);"
                style="display: none;"
              >
                Reset
              </a>
            </span>
          </h4>
        </div>
        <div class="col-md-4 dc-chart" id="dc-misclassified-piechart">
          <h4>
            Classification Accuracy
            <span>
              <a
                class="reset d3Button"
                href="javascript:void(0);"
                style="display: none;"
              >
                Reset
              </a>
            </span>
          </h4>
        </div>`);

      // 2nd row of charts: True Confidence & Max Classifer Confidence histograms
      panelBodyContainer.append('div').classed('row', true).html(`
        <div class="col-md-6 dc-chart" id="dc-maxconfidence-chart">
          <h4>
            Max Classifier Confidence Distribution
            <span>
              <a
                class="reset btn btn-primary btn-xs"
                href="javascript:void(0);"
                style="display: none;"
              >
                Reset
              </a>
            </span>
          </h4>
        </div>
        <div class="col-md-6 dc-chart" id="dc-trueconfidence-chart">
          <h4>
            True Class Confidence Distribution
            <span>
              <a
                class="reset d3Button"
                href="javascript:void(0);"
                style="display: none;"
              >
                Reset
              </a>
            </span>
          </h4>
        </div>`);
    } else {
      panelBodyContainer.append('div').classed('row', true).html(`
        <div class="dc-chart" id="dc-classifierlabel-chart">
          <h4>
            Distribution by Classifier Labels
            <span>
              <a
                class="reset d3Button"
                href="javascript:void(0);"
                style="display: none;"
              >
                Reset
              </a>
            </span>
          </h4>
        </div>
        <div class="dc-chart" id="dc-maxconfidence-chart">
          <h4>
            Max Classifier Confidence Distribution
            <span>
              <a
                class="reset d3Button"
                href="javascript:void(0);"
                style="display: none;"
              >
                Reset
              </a>
            </span>
          </h4>
        </div>
      `);
    }

    // Sortable Table
    outerContainer.append('div').attr('id', 'FilteredRecords').html(`
      <div class="">
        <h3>Filtered Records</h3>
        <table class="table table-bordered table-hover dc-chart" id="dc-table-graph">
          <thead>
            <tr class="header">
              <!-- Programmatically insert table headers here -->
            </tr>
          </thead>
        </table>
        <div id="paging">
          Showing <span id="begin"></span>-<span id="end"></span> of <span id="size"></span>
          <input id="Prev" class="btn btn-default btn-lg" type="button" value="Prev" onclick="javascript:void(0)" />
          <input id="Next" class="btn btn-default btn-lg" type="button" value="Next" onclick="javascript:void(0)" />
        </div>
        <div style="padding-top: 10px; clear: both;"><!--Do Not Delete--></div>
      </div>`);

    // Just to provide some whitespace between bottom of paging buttons and page-end
    // outerContainer.append('div')
    //     .attr('id', 'vertical-whitespace')
    //     .style('padding', '10px');

    // Data Table Pagination
    let tableOffset = 0;
    const tablePageSize = 15;
    const dataTable = dc.dataTable('#dc-table-graph');

    // Variables below act as globals that can be referenced if truth is provided in data file
    let trueLabelChart = '';
    let misclassifiedPieChart = '';
    let trueConfidenceChart = '';

    const dim = {}; // Stores all crossfilter dimensions
    const groups = {}; // Stores all crossfilter groups
    let cf = {};
    // const colorMapColors = ['#80b1d3', '#fdb462', '#b3de69',
    //   '#fb8072', '#bebada', '#ffed6f', '#8dd3c7', '#fccde5',
    //   '#bc80bd', '#ccebc5', '#d9d9d9', '#ffffb3'];
    // var colorMapColors = ['#1f78b4', '#ff7f00', '#33a02c', '#e31a1c', '#cab2d6',
    //                       '#ffff99', '#a6cee3', '#fb9a99', '#6a3d9a', '#fdbf6f',
    //                       '#b2df8a', '#b15928'];

    const pieChartColors = ['#7dd455', '#ffb652'];
    // var pieChartColors = ['#33a02c', '#ff7f00'];

    const confidenceChartColor = '#6ca3c9';
    // var confidenceChartColor = '#1f78b4';

    function updateTable() {
      // Ensure Prev/Next bounds are correct, especially after filters applied to dc charts
      const totFilteredRecs = cf.groupAll().value();
      const end = tableOffset + tablePageSize > totFilteredRecs ? totFilteredRecs : tableOffset + tablePageSize;
      tableOffset = tableOffset >= totFilteredRecs ? Math.floor((totFilteredRecs - 1) / tablePageSize) * tablePageSize : tableOffset;
      tableOffset = tableOffset < 0 ? 0 : tableOffset;

      dataTable.beginSlice(tableOffset);
      dataTable.endSlice(tableOffset + tablePageSize);

      // Update Table paging buttons and footer text
      d3.select('#begin')
        .text(tableOffset + 1);
      d3.select('#end')
        .text(end);
      d3.select('#Prev')
        .attr('disabled', tableOffset - tablePageSize < 0 ? 'true' : null);
      d3.select('#Next')
        .attr('disabled', tableOffset + tablePageSize >= totFilteredRecs ? 'true' : null);
      d3.select('#size').text(totFilteredRecs);

      dataTable.redraw();
    }

    function nextPage() {
      tableOffset += tablePageSize;
      updateTable();
    }

    function prevPage() {
      tableOffset -= tablePageSize;
      updateTable();
    }

    // Initialize variables and setup json data
    const classifierLabelChart = dc.rowChart('#dc-classifierlabel-chart').on('filtered', updateTable);
    const maxConfidenceChart = dc.barChart('#dc-maxconfidence-chart').on('filtered', updateTable);

    // stackedBarChart = dc.barChart('#dc-stacked-barchart'),

    // d3.json('output.json', function(error, oldData) {
    const d3Render = (data) => {
      // Clean up and restructure JSON data
      const json = restructureJson(data, noTruth);
      const { labels } = json[0];

      // Setup truth_label based chart objects if truth provided
      if (!noTruth) {
        trueLabelChart = dc.rowChart('#dc-truelabel-chart').on('filtered', updateTable);
        misclassifiedPieChart = dc.pieChart('#dc-misclassified-piechart').on('filtered', updateTable);
        trueConfidenceChart = dc.barChart('#dc-trueconfidence-chart').on('filtered', updateTable);
      }

      // Programmatically insert header labels for table
      let tableHeader = d3.select('.header')
        .selectAll('th');
      if (!noTruth) {
        tableHeader = tableHeader.data([
          { label: 'Pt Id', field_name: 'pt_id', sort_state: 'ascending' },
          // { label: 'Name', field_name: 'name', sort_state: 'ascending' },
          { label: 'Misclassified', field_name: 'misclassified', sort_state: 'ascending' },
          { label: 'True Label', field_name: 'true_label', sort_state: 'ascending' },
          { label: 'Classifier Label', field_name: 'max_label', sort_state: 'ascending' },
          { label: 'True Conf', field_name: 'true_conf', sort_state: 'ascending' },
          { label: 'Max Conf', field_name: 'max_conf', sort_state: 'descending' }, // Note Max Conf row starts off as descending
        ].concat(labels.map((el, i) => ({ label: el, field_name: i, sort_state: 'ascending' }))));
      } else {
        tableHeader = tableHeader.data([
          { label: 'Pt Id', field_name: 'pt_id', sort_state: 'ascending' },
          // { label: 'Name', field_name: 'name', sort_state: 'ascending' },
          { label: 'Classifier Label', field_name: 'max_label', sort_state: 'ascending' },
          { label: 'Max Conf', field_name: 'max_conf', sort_state: 'descending' }, // Note Max Conf row starts off as descending
        ].concat(labels.map((el, i) => ({ label: el, field_name: i, sort_state: 'ascending' }))));
      }

      tableHeader = tableHeader.enter()
        .append('th')
        .text((d) => d.label)
        .on('click', (d, i, nodes) => {
          // Highlight column header being sorted and show glyphicon
          const activeClass = 'info';
          // var alreadyIsActive = d3.select(this).classed(activeClass);
          d3.selectAll('#dc-table-graph th') // Disable all highlighting and icons
            .classed(activeClass, false)
            .selectAll('span')
            .style('visibility', 'hidden');

          const activeSpan = d3.select(nodes[i]) // Enable active highlight and icon for active column for sorting
            .classed(activeClass, true)
            .select('span')
            .style('visibility', 'visible');

          // Toggle sort order state
          d.sort_state = d.sort_state === 'ascending' ? 'descending' : 'ascending';
          const isAscendingOrder = d.sort_state === 'ascending';
          dataTable
            .order(isAscendingOrder ? d3.ascending : d3.descending)
            .sortBy(
              (datum) => {
                if (typeof d.field_name === 'number') {
                  return datum.confs[d.field_name];
                }
                return datum[d.field_name];
              },
            );
          // Reset glyph icon for all other headers and update this headers icon
          activeSpan.attr('class', null);

          // Toggle glyphicon based on ascending/descending sort_state
          activeSpan
            .classed('material-icons', true)
            .text(
              isAscendingOrder ? 'arrow_upward' : 'arrow_downward',
            );

          updateTable();
        });

      // Highlight 'Max Conf' cell on page load
      tableHeader.filter((d) => d.label === 'Max Conf')
        .classed('info', true);

      tableHeader
        .append('span') // add arrows on table headers
        .style('display', 'flex')
        .style('justify-content', 'center')
        .classed('material-icons', true)
        .text('arrow_downward')
        .style('visibility', 'hidden')
        .filter((d) => d.label === 'Max Conf')
        .style('visibility', 'visible');

      cf = crossfilter(json); // Main crossfilter objects - Pushed to global scope

      // Setup dataCount widget - http://dc-js.github.io/dc.js/docs/html/dc.dataCount.html
      const all = cf.groupAll();
      dc.dataCount('.dc-data-count')
        .crossfilter(cf)
        .groupAll(all);

      // Setup different dimensions for plots
      dim.classifierLabel = cf.dimension((d) => d.max_label);
      dim.maxConfidence = cf.dimension((d) => Math.floor(d.max_conf * 50) / 50);
      dim.tableMaxConfidence = cf.dimension((d) => d.max_conf);
      if (!noTruth) { // Don't set these up if no Truth provided
        dim.trueLabel = cf.dimension((d) => d.true_label);
        dim.misclassified = cf.dimension((d) => d.misclassified);
        dim.trueConfidence = cf.dimension((d) => Math.floor(d.true_conf * 50) / 50);
      }

      // Setup different groups for plots
      groups.classifierLabelCounts = dim.classifierLabel.group();

      groups.maxConfidenceCounts = dim.maxConfidence.group();

      if (!noTruth) { // Don't set these up if no Truth provided
        groups.trueLabelCounts = dim.trueLabel.group(); // Default is to reduceCount()
        groups.misclassifiedCounts = dim.misclassified.group();
        groups.trueConfidenceCounts = dim.trueConfidence.group();
      }
      // console.log(groups.maxConfidenceCounts.reduceCount().all());

      // ########################################################
      // Setup all dc.js charts #################################
      // ########################################################
      if (!noTruth) { // Don't set these up if no Truth provided
        // Setup trueLabel count rowChart
        trueLabelChart
          .width(300)
          .height(180)
          .margins({
            top: 5, left: 42, right: 10, bottom: 35,
          })
          .dimension(dim.trueLabel)
          .group(groups.trueLabelCounts)
          .colors(d3.scaleOrdinal(d3.schemePaired))
          .label((d) => d.key)
          .labelOffsetX(4)
          // .title(function(d){return d.value;})
          .title(() => {})
          .elasticX(true)
          .xAxis()
          .ticks(4);

        trueConfidenceChart
          .width(480)
          .height(180)
          .centerBar(true)
          .x(d3.scaleLinear().domain([0, 1.05]))
          .gap(0)
          .dimension(dim.trueConfidence)
          .group(groups.trueConfidenceCounts)
          .colors(confidenceChartColor)
          .filterPrinter((filters) => {
            const filter = filters[0];
            let s = '';
            s += `[${d3.format('.2f')(filter[0])} to ${d3.format('.2f')(filter[1])}]`;
            return s;
          })
          // .filter([0, 1.05])
          .elasticY(true)
          .xAxisLabel('Classifier Confidence for True Class')
          .yAxisLabel('Counts')
          .xUnits(() => 70);

        misclassifiedPieChart
          .width(250)
          .height(180)
          .radius(85)
          .innerRadius(20)
          .dimension(dim.misclassified)
          .title((d) => d.value)
          .group(groups.misclassifiedCounts);
        misclassifiedPieChart
          .ordinalColors(pieChartColors); // Set color for correct vs misclassified
      }

      classifierLabelChart
        .width(300)
        .height(180)
        .margins({
          top: 5, left: 42, right: 10, bottom: 35,
        })
        .dimension(dim.classifierLabel)
        .group(groups.classifierLabelCounts)
        .colors(d3.scaleOrdinal(d3.schemePaired))
        .label((d) => d.key)
        .labelOffsetX(4)
        // .title(function(d){return d.value;})
        .title(() => {})
        .elasticX(true)
        .xAxis()
        .ticks(4);

      maxConfidenceChart
        .width(480)
        .height(180)
        .centerBar(true)
        .x(d3.scaleLinear().domain([0, 1.05]))
        .gap(0)
        .dimension(dim.maxConfidence)
        .group(groups.maxConfidenceCounts)
        .colors(confidenceChartColor)
        .filterPrinter((filters) => {
          const filter = filters[0];
          let s = '';
          s += `[${d3.format('.2f')(filter[0])} to ${d3.format('.2f')(filter[1])}]`;
          return s;
        })
        // .filter([0, 1.05])
        .elasticY(true)
        .xAxisLabel('Maximum Classifier Confidence')
        .yAxisLabel('Counts')
        .xUnits(() => 70);

      // ####################
      // Table of data
      // ####################
      // Create generating functions for each columns
      const columnFunctions = [
        (d) => d.pt_id,
        // (d) => d.name,
        (d) => d.max_label,
        (d) => d.max_conf,
      ];
      if (!noTruth) { // Append these table data generators at correct locations if truth provided
        columnFunctions.splice(2, 0, (d) => (d.misclassified === 'Misclassified' ? 'Yes' : 'No'));
        columnFunctions.splice(3, 0, (d) => d.true_label);
        columnFunctions.splice(5, 0, (d) => d.true_conf);
      }
      // Append data generators for class confidences
      for (let i = 0; i < labels.length; i += 1) { // Note use of `let` to prevent callback `i` always being labels.length
        columnFunctions.push((d) => d.confs[i]);
      }

      // Pagination implemented based on: https://github.com/dc-js/dc.js/blob/master/web/examples/table-pagination.html
      dataTable.width(960).height(800)
        .dimension(dim.tableMaxConfidence)
        .section(() => 'Dummy') // Must pass in. Ignored since .showGroups(false)
        .size(Infinity)
        .columns(columnFunctions)
        .showSections(false)
        .sortBy((d) => d.max_conf)
        .order(d3.descending);

      // Render the Charts
      dc.renderAll();

      updateTable();

      // Function to add x-label to Row Charts
      function addXLabel(chartToUpdate, displayText, dx, dy) {
        chartToUpdate.svg()
          .append('text')
          .attr('class', 'x-axis-label')
          .attr('text-anchor', 'middle')
          .attr('x', (chartToUpdate.width() / 2) + dx)
          .attr('y', chartToUpdate.height() + dy)
          .text(displayText);
      }
      function addYLabel(chartToUpdate, displayText, dx, dy) {
        chartToUpdate.svg()
          .append('text')
          .attr('class', 'y-axis-label')
          .attr('text-anchor', 'middle')
          .attr('x', (-chartToUpdate.height() / 2) - dy)
          .attr('y', 10 - dx)
          .attr('transform', 'rotate(-90)')
          .text(displayText);
      }

      // Add axis labels for plots
      if (!noTruth) {
        addXLabel(trueLabelChart, 'Total counts', 10, 0);
        addYLabel(trueLabelChart, 'True labels', -4, -7);
      }
      addXLabel(classifierLabelChart, 'Total counts', 10, 0);
      addYLabel(classifierLabelChart, 'Classifier labels', -4, -7);

      // Reusable function to add on-click callback on charts
      function addResetCallback(chartSelector, chartObj) {
        d3.select(chartSelector)
          .on('click', () => {
            chartObj.filterAll();
            dc.redrawAll();
            return false;
          });
      }

      // Add on-click callbacks for individual chart 'reset' links
      addResetCallback('#dc-maxconfidence-chart a', maxConfidenceChart);
      addResetCallback('#dc-classifierlabel-chart a', classifierLabelChart);

      d3.select('#crossFilterGlobalReset')
        .on('click', () => {
          dc.filterAll();
          dc.redrawAll();
          return false;
        });

      d3.select('#Prev')
        .on('click', () => {
          prevPage();
          return false;
        });

      d3.select('#Next')
        .on('click', () => {
          nextPage();
          return false;
        });

      if (!noTruth) {
        addResetCallback('#dc-trueconfidence-chart a', trueConfidenceChart);
        addResetCallback('#dc-misclassified-piechart a', misclassifiedPieChart);
        addResetCallback('#dc-truelabel-chart a', trueLabelChart);
      }

      // Delete DIVs for Truth based charts if no truth provided
      // var truthAnchors = ['#dc-truelabel-chart','#dc-misclassified-piechart','#dc-trueconfidence-chart'];
      // if (noTruth) {
      //   truthAnchors.forEach(function(selector) {
      //     d3.select(selector).remove();
      //   })
      // }

      // Callback function to reassign table row callbacks for modalView display
      const tableRowClickCallback = () => { // Add callbacks for rows in table to show ModalView
        d3.selectAll('.dc-table-row')
          .on('click', (d) => patientDetails.exploreId(d.pt_id));
      };
      dataTable.on('postRedraw', tableRowClickCallback); // Needs to be rebound on each redraw of table
      tableRowClickCallback(); // Needs to be bound initially upon 1st draw

      // #################
      // Tooltip Stuff
      // #################
      // const tooltipOffsetY = 77; // Vertical offset for headerMenu (since it is outside of D3ManagedCrossFilter DOM)
      const tooltipMouseoverFn = (d) => {
        const bbox = getScreenBBox(d3.event.target);
        // const tooltipOffsetY = d3.select('#resultsExplorer').node().getBoundingClientRect().top;
        d3.select('#keyVal')
          .text(d.key);
        d3.select('#valueVal')
          .text(d.value);
        d3.select('#tooltip')
          .style('left', `${bbox.n.x - (d3.select('#tooltip').node().getBoundingClientRect().width / 2)}px`)
          .style('top', `${bbox.n.y - d3.select('#tooltip').node().getBoundingClientRect().height - 7}px`)
          .style('visibility', 'visible');
      };
      const tooltipMouseoutFn = () => {
        d3.select('#tooltip')
          .style('visibility', 'hidden');
      };

      // Add tooltip callbacks to rects and text class labels for row charts
      d3.selectAll('.row > rect,.row > text')
        .on('mouseover', tooltipMouseoverFn)
        .on('mouseout', tooltipMouseoutFn);

      // Add tooltip for pieChart
      if (!noTruth) {
        d3.selectAll('.pie-slice > path,text.pie-slice')
          .on('mouseover', () => {
            d3.select('#tooltip')
              .style('visibility', 'visible');
          })
          .on('mousemove', (d) => {
            const tooltipOffsetY = d3.select('#resultsExplorer').node().getBoundingClientRect().top;
            d3.select('#keyVal')
              .text('Count');
            d3.select('#valueVal')
              .text(d.value);
            d3.select('#tooltip')
              .style('left', `${d3.event.pageX - (d3.select('#tooltip').node().getBoundingClientRect().width / 2)}px`)
              // .style('top',  d3.event.pageY + 'px');
              .style('top', `${d3.event.pageY - d3.select('#tooltip').node().getBoundingClientRect().height - 12 - tooltipOffsetY - window.scrollY}px`);
          })
          .on('mouseout', tooltipMouseoutFn);
      }
    }; // End d3.json function

    d3Render(props);
  },
};

export default CrossFilterController;
