import React from 'react';

const Message = (props) => {
  let hidden = "hidden";
  if (props.visible) {
    hidden = "";
  }
  // let buttonHidden = "hidden";
  let buttonHtml = <p />;
  if (props.showButton) {
    buttonHtml = <button type="button" className={"btn btn-primary"} onClick={props.callbacks.offMessage}>{props.buttonText}</button>;
  }
  let progressHtml = <div />;
  if (props.showProgress) {
    progressHtml = (
      <div>
        <div className="progress">
          <div className="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style={{width: "100%"}} />
        </div>
      </div>
    );
  }
  return (
    <div id="Message" className={`jumbotron vertical-center message-window ${hidden}`}>
      <div className="container">
        <h1 className="display-3">{props.title}</h1>
        <p className="lead">{props.text}</p>
        {buttonHtml}
        {progressHtml}
      </div>
    </div>
  );
};

export default Message;
