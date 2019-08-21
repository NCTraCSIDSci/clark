import React from 'react';
import {ButtonGroup, Button} from 'react-bootstrap';

class NoteRendererSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedValue: 'None',
      selectedIndex: 0,
      extraClasses: ["", "btn-Features", "btn-Sectioning"],
    };

    this.setSelectionNoCallback = this.setSelectionNoCallback.bind(this);
    this.selectIndex = this.selectIndex.bind(this);
  }

  setSelectionNoCallback(name) {
    const items = this.props.items;

    const val = items.findIndex(it => it === name);
    if (val >= 0 && val < items.length) {
      this.setState({selectedValue: items[val], selectedIndex: val});
    } else {
      // Weird input, ignore
    }
  }

  selectIndex(val) {
    // console.log(val)
    this.setState({selectedValue: this.props.items[val], selectedIndex: val});
    this.props.newSelectionCallback(val, this.props.items[val]);
  }

  render() {
    const looper = [];
    for (let i = 0; i < this.props.items.length; i += 1) {
      let mleft = "0px";
      if (i > 0) {
        mleft = "5px";
      }
      if (i === this.state.selectedIndex) {
        looper.push({key: i, name: this.props.items[i], marginLeft: mleft, isActive: true});
      } else {
        looper.push({key: i, name: this.props.items[i], marginLeft: mleft, isActive: false});
      }
    }
    // <Button key={"button_" + index} href="#" onClick={() => clickCallback(index)} style={{borderRadius: 0, border: "none", backgroundColor: item.color, marginLeft: item.marginLeft, borderBottom: item.color}}>{item.name}</Button>

    // backgroundColor: this.props.colors[i]
    // borderBottom: item.backgroundColor,backgroundColor: item.backgroundColor
    return (
      <ButtonGroup justified>
        {
          looper.map((item, index) => (
            <Button key={`button_${index}`} href="#" onClick={() => this.selectIndex(index)} style={{marginLeft: item.marginLeft}} id={item.isActive ? "highlight" : ""}>{item.name}</Button>
        ))}
      </ButtonGroup>
    );
  }
}

export default NoteRendererSelector;
