import React from 'react';
import firebase from 'firebase';
import ReactFireMixin from 'reactfire';

let ImportanceChartElementEditor = React.createClass({
  mixins : [ReactFireMixin],
  componentWillMount() {
    let ref = firebase.database().ref(this.props.elementKey);
    this.bindAsObject(ref, "element");
  },
  update(field, validate) {
    let that = this;
    return function (e) {
      let update = {};
      update[field] = e.target.value;
      if (validate) {
        update[field] = validate(e.target.value);
      }
      firebase.database().ref(that.props.elementKey).update(update);
    }
  },
  render : function () {
    return <div>
      <input
        value={this.state.element.title}
        onChange={this.update('title')}/>
      <select
        type="number"
        value={this.state.element.importance}
        onChange={this.update('importance', parseFloat)}>
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4</option>
        <option>5</option>
      </select>
    </div>
  }
});

export default ImportanceChartElementEditor;