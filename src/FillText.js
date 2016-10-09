import React from 'react';
import ReactDOM from 'react-dom';

import $ from 'jquery';


export default React.createClass({
  componentDidMount() {
    fillText(ReactDOM.findDOMNode(this));
  },
  componentDidUpdate() {
    fillText(ReactDOM.findDOMNode(this));
  },
  render() {
    let style = {
      position : 'relative',
      width : '100%',
      height : '100%'
    };
    return (<div style={style}>{this.props.text}</div>);
  }
});

function fillText(element, alignment) {
    function style(el, styles) {
        Object.keys(styles).forEach((field)=>{
          el.style[field] = styles[field];
        });
    }

    function width(el, width) {
        return width? $(el).width(width) : $(el).width();
    }

    function height(el, height) {
        return height? $(el).height(height) : $(el).height();
    }

    var children = element.childNodes;

    var sizer;

    function fit() {

        //  edge cases that would cause infinite loops below
        if (element.textContent.trim() === '') return;
        if (!document.contains(element)) return;

        var text_element = document.createElement('div');
        style(text_element, {
            position : 'relative',
            display : 'inline-block'
        });
        
        //  remove sizer if already exists
        if (sizer) element.removeChild(sizer);
        children.forEach(function (child) {
          text_element.appendChild(child);
        });
        sizer = document.createElement('div');
        sizer.appendChild(text_element);

        sizer.style.fontSize = '12px';

        element.appendChild(sizer);

        var text_aspect_ratio = width(text_element) / height(text_element);
        var aspect_ratio = width(element) / height(element);
        if (text_aspect_ratio > aspect_ratio) {
            width(sizer, width(text_element));
            height(sizer, width(text_element) / aspect_ratio);
        }
        else {
            height(sizer, height(text_element));
            width(sizer, height(text_element) * aspect_ratio);
        }
        var w = width(sizer);
        var h = height(sizer);
        var scaleFactor = 0.9;
        while (true) {
            w *= scaleFactor;
            h *= scaleFactor;
            width(sizer, w);
            height(sizer, h);
            if (width(sizer) < width(text_element)|| height(sizer) < height(text_element)) {
                width(sizer, w/scaleFactor);
                height(sizer, h/scaleFactor);
                break;
            }
        }
        //    the sizer is now closest aspect ratio as its parent's
        var scale = Math.min(width(element)/width(sizer), height(element)/height(sizer));
        style(sizer, {
            'webkitTransformOrigin': '0% 0%',
            'mozTransformOrigin': '0% 0%',
            'msTransformOrigin': '0% 0%',
            'oTransformOrigin': '0% 0%',
            'transformOrigin': '0% 0%',
            'transform' : 'scale(' + scale + ', ' + scale + ')'
        });

        var top = (height(sizer) - height(text_element))/2/scale + 'px';
        var left = (width(sizer) - width(text_element))/2/scale + 'px';
        var right = 'auto';
        var bottom = 'auto';

        if (/right/.test(alignment)) {
          right = 0;
          left = 'auto';
        }
        else if (/left/.test(alignment)) {
          left = 0;
        }
        
        if (/top/.test(alignment)) {
          top = 0;
        }
        else if (/bottom/.test(alignment)) {
          bottom = 0;
          top = 'auto';
        }

        console.log(top);

        style(text_element, {
            position: 'absolute',
            top : top, //  for some reason top without px doesn't work...
            left : left,
            right : right,
            bottom : bottom
        });
        style(element, {opacity : 1});
    }
    fit();
}