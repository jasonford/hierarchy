import React from 'react';
import firebase from 'firebase';
import ReactFireMixin from 'reactfire';
import ImportanceChartElement from './ImportanceChartElement';

import './ImportanceChart.css';

//  calculate the total importance of a row
function calculateRowImportance(row) {
  let importance = 0;
  row.forEach((element) => {
    importance += parseFloat(element.importance);
  });
  return importance;
}

//  create a square 2d matrix[row][column]
function getRowsAndColumns(data) {
  data = data || [];
  let elementsPerRow = Math.ceil(Math.pow(data.length, 0.5));
  let numRows = Math.ceil(data.length/elementsPerRow);
  let rows = [];
  for (let r=0; r<numRows; r++) {
    let row = [];
    for (let c=0; c<elementsPerRow; c++) {
      let cell = data[r*elementsPerRow + c];
      if (cell) {
        row.push(cell);
      }
    }
    rows.push(row);
  }
  if (rows.length && rows[rows.length-1].length < elementsPerRow/2) {
    //  remove the last row and add it to the second to last
    let lastRow = rows.pop();
    rows[rows.length-1] = rows[rows.length-1].concat(lastRow);
  }
  return rows;
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
      importance : Math.random() + 1,
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
    let rowData = getRowsAndColumns(elements);
    let rows = [];
    rowData.forEach((columnData) => {
      let columns = [];
      let rowImportance = calculateRowImportance(columnData);
      let focusedRow = false;
      columnData.forEach((elementData) => {
        if (that.state.focused === elementData.key) {
          focusedRow = true;
        }
        columns.push(<ImportanceChartElement
          elementKey={that.props.elementKey+'/elements/'+elementData.key}
          key={elementData.key}
          moveElement={that.moveElement}
          focus={focus}
          focused={focused}/>);
        columns.push(<br/>)
      });
      let rowStyle = {
        flexGrow : focusedRow? 1000 :rowImportance
      };
      rows.push(
        <div
          className="importance-chart-row"
          style={rowStyle}
          key={rows.length}>
          {columns}
        </div>
      );
    });
    return (
      <div className="importance-chart">
        {rows}
        <div ref="adderRemover" className="importance-chart-options"></div>
      </div>
    );
  }
});

export default ImportanceChart;