import React from 'react';

/* An AccordionItem contains another React component (such as RegexList or TreeView). It's laid out
using a Bootstrap card-style layout, but assumes that there is exactly ONE child. However, the
child generally contains a list and so AccordionItem expects properties this.props.count (how many elements the child has) to exist.
*/
class AccordionItem extends React.Component {
  constructor(props) {
    super(props);

    this.collapseId = null;
    // loadable - Load callback
    // saveable - save callback
    // isNotModified - indicates if edits have NOT been made and save is recommended - Only used if saveable is set. Making this use opposite logic allows the default to have no checkmark
    this.collapseEvent = this.collapseEvent.bind(this);
  }

  componentDidMount() {
    this.collapseId.addEventListener('shown.bs.collapse', this.collapseEvent);
    window.addEventListener('resize', this.collapseEvent);
  }

  componentWillUnmount() {
    this.collapseId.removeEventListener('shown.bs.sollapse', this.collapseEvent);
  }

  collapseEvent() {
    if (typeof (this.props.onDisplay) === 'function') {
      this.props.onDisplay(this); // Pass this in as caller
    }
  }

  render() {
    let rightLoadMenu = "";
    if (this.props.loadable) {
      rightLoadMenu = <a href={`#load-${this.props.id}`} onClick={this.props.loadable}><span className="glyphicon glyphicon-folder-open" /></a>;
    }
    let rightSaveMenu = "";
    if (this.props.saveable) {
      let saveIcon = "glyphicon glyphicon-floppy-disk";
      if (!this.props.disableSave && this.props.isNotModified) {
        saveIcon = "glyphicon glyphicon-floppy-saved";
      }
      if (this.props.disableSave) {
        rightSaveMenu = <span className={"gray-text"}><span className={saveIcon} /></span>;
      } else {
        rightSaveMenu = <a href={`#save-${this.props.id}`} onClick={this.props.saveable}><span className={saveIcon} /></a>;
      }
    }
    const headingId = `heading${this.props.id}`;
    const collapseId = `collapse${this.props.id}`;

    const childrenWithProps = React.Children.map(this.props.children,
      child => React.cloneElement(child, {ref: "child"})); // TODO: this seems weird

    return (

      <div className="card" id>
        <div className="card-header" role="tab" id={headingId}>
          <h5 className="mb-0">
            <a data-toggle="collapse" data-parent="#accordion" href={`#${collapseId}`} aria-expanded="false" aria-controls={collapseId} className="collapsed">
              {this.props.heading} <span className="badge">{this.props.count}</span>
            </a>
            <span className="pull-right"> {rightLoadMenu} &nbsp; {rightSaveMenu} </span>
          </h5>
        </div>

        <div ref={(ref) => { this.collapseId = ref; }} id={collapseId} className="collapse" role="tabpanel" aria-labelledby={headingId}>
          <div className="card-block">
            {childrenWithProps}
          </div>
        </div>
      </div>
    );
  }
}

export default AccordionItem;
