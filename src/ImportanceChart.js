import React from 'react';
import firebase from 'firebase';
import ReactFireMixin from 'reactfire';
import ImportanceChartElement from './ImportanceChartElement';

import './ImportanceChart.css';

//  calculate the total importance of a row
function calculateRowImportance(elements, elementsPerRow, index) {
  let start = index - index%elementsPerRow;
  let end = Math.min(elements.length, start + elementsPerRow);
  let rowImportance = 0;
  for (var i=start; i<end; i++) {
    rowImportance += elements[i].importance;
  }
  return rowImportance;
}

function calculateTotalImportance(elements) {
  let total = 0;
  elements.forEach((element)=>{
    total += element.importance;
  });
  return total;
}

function calculateElementsPerRow(data) {
  return Math.ceil(Math.pow(data.length, 0.5));
}

let ImportanceChart = React.createClass({
  mixins : [ReactFireMixin],
  componentWillMount() {
    let ref = firebase.database().ref(this.props.elementKey).orderByChild("index");
    this.bindAsObject(ref, "element");
  },
  componentDidMount: function () {
    let that = this;
    let rootNode = this.refs.adderRemover;
    rootNode.addEventListener("onedrag", (e)=>{
      rootNode.style.transform = 'translate('+e.tx+'px, '+e.ty+'px)';
    });
    rootNode.addEventListener("drop", (e)=>{
      rootNode.style.transform = null;
      that.addElement();
    });
  },
  addElement(index) {
    index = index || 1;
    if (this.state.element.elements) {
      index = Object.keys(this.state.element.elements).length;
    }
    this.firebaseRefs.element.child('elements').push({
      title : Date.now(),
      index : index,
      importance : 1,
      elements : []
    });
  },
  moveElement(element, index) {
    let that = this;
    let els = this.state.element.elements;
    let elements = Object.keys(els).map((key)=>{
      let obj = that.state.element.elements[key];
      return obj;
    });
    elements.sort(function (a,b) {
      return a.index - b.index;
    });

    //  assign new index
    let newIndex;
    if (index === 0) {
      newIndex = elements[0].index - 1;
    }
    else if (index < elements.length) {
      newIndex = (elements[index].index + elements[index-1].index)/2;
    }
    else {
      newIndex = elements[elements.length-1].index + 1;
    }
    let key = element['.key'];
    firebase.database().ref(this.props.elementKey).child('elements/'+key).update({
      index : newIndex
    });
    this.forceUpdate();
  },
  render() {
    let that = this;
    function focus(elementKey) {
      that.setState({focused : elementKey});
    }
    function focused(elementKey) {
      return that.state.focused === elementKey;
    }
    function inFocusedRow(elements, elementsPerRow, index) {
      let start = index - index%elementsPerRow;
      let end = Math.min(elements.length, start + elementsPerRow);
      let isIn = false
      for (var i=start; i<end; i++) {
        if (that.state.focused == elements[i].key) {
          isIn = true;
          break;
        }
      }
      return isIn;
    }
    function calculateFocusedRowImportance(elements, elementsPerRow, index) {
      let importance = 0;
      elements.forEach((element, index)=>{
        if (inFocusedRow(elements, elementsPerRow, index)) {
          importance += element.importance;
        }
      });
      return importance;
    }
    let els = [];
    if (this.state && this.state.element.elements) {
      els = this.state.element.elements;
    }
    let elements = Object.keys(els).map((key)=>{
      that.state.element.elements[key].key = key;
      return that.state.element.elements[key];
    });
    elements.sort(function (a,b) {
      return a.index - b.index;
    });
    let elementsPerRow = calculateElementsPerRow(elements);
    let elementDOM = [];
    let totalImportance = calculateTotalImportance(elements);
    elements.forEach((elementData, index) => {
      function height() {
        //  if focused, give focused row height presidence
        let h = calculateRowImportance(elements, elementsPerRow, index)/totalImportance;
        if (that.state.focused) {
          if (inFocusedRow(elements, elementsPerRow, index)) {
            h = 0.95;
          }
          else {
            h = 0.05 * calculateRowImportance(elements, elementsPerRow, index)/(totalImportance-calculateFocusedRowImportance(elements, elementsPerRow, index));
          }
        }
        return (100*h) + "%";
      }
      elementDOM.push(<ImportanceChartElement
            elementKey={that.props.elementKey+'/elements/'+elementData.key}
            key={elementData.key}
            moveElement={that.moveElement}
            focus={focus}
            focused={focused}
            height={height}/>);
      if ((index+1)%(elementsPerRow)===0) {
        elementDOM.push(<div className="importance-chart-row-divider" key={index}></div>);
      }
    });

    return (
      <div className="importance-chart">
        {elementDOM}
        <div ref="adderRemover" className="importance-chart-options"></div>
      </div>
    );
  }
});

export default ImportanceChart;