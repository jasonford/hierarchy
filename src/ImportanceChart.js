import React from 'react';
import firebase from 'firebase';
import ReactFireMixin from 'reactfire';
import $ from 'jquery';

import FillText from './FillText.js';

import './ImportanceChart.css';

//  calculate the total importance of a row
function calculateRowImportance(row) {
  let importance = 0;
  row.forEach((element) => {
    importance += element.importance;
  });
  return importance;
}

//  create a square 2d matrix[row][column]
function getRowsAndColumns(data) {
  data = data || [];
  let elementsPerRow = Math.ceil(Math.pow(data.length, 0.5)+1);
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
  return rows;
}

function withinBoundingBox(event, bbox) {
  return event.x > bbox.left && event.x < bbox.right && event.y > bbox.top && event.y < bbox.bottom;
}

function onRightSide(event, bbox) {
  return event.x > bbox.left + bbox.width/2;
}

let ImportanceChartElement = React.createClass({
  mixins : [ReactFireMixin],
  componentWillMount() {
    let ref = firebase.database().ref(this.props.elementKey);
    this.bindAsObject(ref, "element");
  },
  componentDidMount: function () {
    let that = this;
    let rootNode = this.refs.root;
    rootNode.addEventListener("onedrag", (e)=>{
      rootNode.userSelect = 'none';
      rootNode.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.2)';
      rootNode.style.zIndex = 10;
      rootNode.style.transform = 'translate('+e.tx+'px, '+e.ty+'px)';
    });
    rootNode.addEventListener("drop", (e)=>{
      rootNode.userSelect = null;
      rootNode.style.boxShadow = null;
      rootNode.style.zIndex = null;
      rootNode.style.transform = null;
      let moved = false;
      setTimeout(function () {
        $(rootNode).parent().parent().find('.importance-chart-element').each(function (index,el) {
          if (moved || rootNode === el) return;
          let bbox = el.getBoundingClientRect();
          if (withinBoundingBox(e, bbox)) {
            if (onRightSide(e, bbox)) {
              index += 1;
            }
            that.props.moveElement(that.state.element, index);
            moved = true;
          }
        });
      });
    });
  },
  render() {
    let that = this;
    let importanceChart;
    if (this.state.elements) {
      importanceChart = <ImportanceChart elementKey={this.props.elementKey} />;
    }
    let overlay = [];
    let style = {
      flexGrow : this.state.element.importance
    };
    if (that.state.active) {
      overlay = <div className="importance-chart-element-overlay">
        <FillText
          text={this.state.element.title}
          key={this.state.element.title}/>
      </div>;
    }
    return (<div
      ref="root"
      className="importance-chart-element"
      key={this.props.elementKey}
      style={style}>
      {importanceChart}
      {overlay}
      {this.props.elementKey}<br/>
      {this.state.element.index}
    </div>);
  }
});


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
      return a.index >= b.index;
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
    let els = [];
    if (this.state && this.state.element.elements) {
      els = this.state.element.elements;
    }
    let elements = Object.keys(els).map((key)=>{
      that.state.element.elements[key].key = key;
      return that.state.element.elements[key];
    });
    elements.sort(function (a,b) {
      return a.index >= b.index;
    });
    let rowData = getRowsAndColumns(elements);
    let rows = [];
    rowData.forEach((columnData) => {
      let columns = [];
      let rowImportance = calculateRowImportance(columnData);
      columnData.forEach((elementData) => {
        columns.push(<ImportanceChartElement
          elementKey={that.props.elementKey+'/elements/'+elementData.key}
          key={elementData.key}
          moveElement={that.moveElement}/>);
      });
      let rowStyle = {
        flexGrow : rowImportance
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