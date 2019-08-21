import React from 'react';

/* A dropdown that is loadable from properties, which lets us load items from a server.
   this.props.item contains the list of items with {id: "", name: ""} as the contents of
   one dropdown item. this.props.onSelect should contain a callback function to the container element
   to notify when an element has been selected.
*/
const Dropdown = (props) => {
  let displayName = "Unknown";
  if (props.selected && props.selected.name) {
    displayName = props.selected.name;
  }
  let items = [];
  if (props.items && props.items.length > 0) {
    items = props.items;
  }
  return (
    <div className="btn-group">
      <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        {displayName}<span className="caret" />
      </button>
      <ul className="dropdown-menu">
        {items.map(item => (
          <li onClick={props.onSelect} key={item.id}><a href="#" id={item.id}>{item.name}</a></li>
        ))}
      </ul>
    </div>

  );
}; // dropdown-relative


export default Dropdown;
