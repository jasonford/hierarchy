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
    let innerNode = this.refs.inner;
    let key = that.state.element['.key'];

    rootNode.addEventListener("tap", (e)=>{
      that.props.focus(key);
    });

    rootNode.addEventListener("doubletap", (e)=>{
      that.props.focus();
    });

    let offX;
    let offY;
    rootNode.addEventListener("onedrag", (e)=>{
      if (!that.props.focused(key)) {
        $(innerNode).addClass('dragging');
        offX = e.tx;
        offY = e.ty;
        innerNode.style.transform = 'translate('+offX+'px, '+offY+'px)';
      }
    });
    rootNode.addEventListener("drop", (e)=>{
      if (e.swiped === 'up') { // swiping up removes the element
        firebase.database().ref(that.props.elementKey).remove();
      }
      else {
        $(innerNode).removeClass('dragging');
        innerNode.style.transform = null;
        let moved = false;
        $(rootNode).parent().parent().find('.importance-chart-element').each(function (index,el) {
          if (moved || rootNode === el) return;
          let bbox = el.getBoundingClientRect();
          if (withinBoundingBox(e, bbox)) {
            if (onRightSide(e, bbox)) {
              index += 1;
            }
            let bx = rootNode.getBoundingClientRect().left;
            let by = rootNode.getBoundingClientRect().top;
            that.props.moveElement(that.state.element, index);
            let ax = rootNode.getBoundingClientRect().left;
            let ay = rootNode.getBoundingClientRect().top;
            offX = (bx + offX) - ax;
            offY = (by + offY) - ay;
            innerNode.style.transform = 'translate('+offX+'px, '+offY+'px)';
            setTimeout(function () {
              $(innerNode).addClass('dropping');
              innerNode.style.transform = null;
              $(innerNode).one('transitionend', function (event) {
                $(innerNode).removeClass('dropping');
              });
            });

            moved = true;
            //  set up animate too
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
      height : this.props.height()
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
      <div
        ref="inner"
        className="importance-chart-element-inner">
        {importanceChart}
        {overlay}
        {this.props.focused(key) ? <ImportanceChartElementEditor elementKey={this.props.elementKey}/>:this.state.element.title}
      </div>
    </div>);
  }
});

export default ImportanceChartElement;