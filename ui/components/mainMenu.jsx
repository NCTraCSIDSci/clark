import React from 'react';

const MainMenu = (props) => {
  let hidden = "hidden";
  if (props.visible) {
    hidden = "";
  }
  return (
    <div id="MainMenu" className={`container ${hidden}`}>
      <div className="row top-padding bottom-padding">
        <div className="col-md-10 col-md-offset-1 text-center">
          <h1><span>CoVar/Tracs</span>Medical Record Predictor</h1>
          <p>To get started select one of the options below.</p>
          <div className="col-md-4 col-md-offset-2">
            <button className="btn btn-default btn-lg btn-block" type="button" onClick={props.callbacks.startFresh}>
              <span>Start Fresh:</span>Load a Corpus
            </button>
          </div>
          <div className="col-md-4">
            <button className="btn btn-default btn-lg btn-block" type="button" onClick={props.callbacks.loadSession}>
              <span>Continue where you left off:</span>Load a Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
