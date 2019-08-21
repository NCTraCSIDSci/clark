import React from 'react';

const TopMenu = (props) => {
  // <a className="navbar-brand" href="#"><img src="images/logo_covar_wMRP.png" alt="CoVar Applied Technologies MRP"></a>

  const finishedGlyph = <span className="glyphicon glyphicon-ok green-text" />;
  return (
    <div id="TopMenu" className="fixed-top">
      <nav className="navbar navbar-inverse navbar-static-top">
        <div className="container">
          <div className="navbar-header">
            <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar" />
              <span className="icon-bar" />
              <span className="icon-bar" />
            </button>
            <a className="navbar-brand" href="#" onClick={props.callbacks.onMain}>CoVar/Tracs MRP</a>
          </div>
          <div className="collapse navbar-collapse">
            <ul className="nav navbar-nav navbar-right">
              <li><a href="#" onClick={props.callbacks.onFeaturesTrainingCorpus}>{props.finished.trainingCorpus && finishedGlyph} Training Corpus</a></li>
              <li><a href="#" onClick={props.callbacks.onFeatures}>{props.finished.features && finishedGlyph} Features</a></li>
              <li><a href="#" onClick={props.callbacks.onRun}>{(props.finished.crossValResults || props.finished.testResults) && finishedGlyph} Algorithm</a></li>
              <li><a href="#" onClick={props.callbacks.onExplore}>{props.finished.explore && finishedGlyph} Explore</a></li>
              <li className="dropdown">
                <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">More<i className="fa fa-angle-down" /></a>
                <ul className="dropdown-menu">
                  <li><a href="#" onClick={props.callbacks.startFresh}>Start Fresh</a></li>
                  <li><a href="#" onClick={props.callbacks.loadSession}>Load Session</a></li>
                  <li><a href="#" onClick={props.callbacks.saveSession}>Save Session</a></li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default TopMenu;
