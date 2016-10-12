import React from 'react';
import firebase from 'firebase';
import ReactFireMixin from 'reactfire';
import $ from 'jquery';
import FillText from './FillText.js';
import ImportanceChart from './ImportanceChart';
import ImportanceChartElementEditor from './ImportanceChartElementEditor';

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

    rootNode.addEventListener("tap", (e)=>{
      that.props.focus(that.state.element['.key']);
    });

    rootNode.addEventListener("doubletap", (e)=>{
      that.props.focus();
    });

    rootNode.addEventListener("onedrag", (e)=>{
      $(rootNode).addClass('dragging');
      rootNode.style.transform = 'translate('+e.tx+'px, '+e.ty+'px)';
    });
    // swiping right removes
    rootNode.addEventListener("drop", (e)=>{
      if (e.swiped === 'up') {
        firebase.database().ref(that.props.elementKey).remove();
      }
      else {
        $(rootNode).removeClass('dragging');
        rootNode.style.transform = null;
        let moved = false;
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
      }
    });
  },
  render() {
    let key = this.state.element['.key'];
    let that = this;
    let importanceChart;
    if (this.state.elements) {
      importanceChart = <ImportanceChart elementKey={this.props.elementKey} />;
    }
    let overlay = [];
    let style = {
      flexGrow : this.props.focused(key)? 100 : this.state.element.importance,
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
      {this.props.focused(key) ? <ImportanceChartElementEditor elementKey={this.props.elementKey}/>:this.state.element.title}
    </div>);
  }
});

export default ImportanceChartElement;