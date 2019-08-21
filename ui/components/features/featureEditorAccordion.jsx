import React from 'react';

const FeatureEditorAccordion = (props) => {
  const children = React.Children.map(props.children, (child, i) => React.cloneElement(child, {id: i}));

  return (
    <div id="FeatureEditorAccordion" role="tablist" aria-multiselectable="true">
      {children}
    </div>
  );
};

export default FeatureEditorAccordion;
