window.addEventListener("load", function () {
  function once(node, types, callback) {
    types.split(" ").forEach(function (type) {
      function reaction(e) {
        // remove event
        types.split(" ").forEach(function (type) {
          node.removeEventListener(type, reaction);
        });
        // call handler
        return callback(e);
      }
      node.addEventListener(type, reaction);
    });

  }
  
  function customEvent(type, info) {
    var e = new CustomEvent(type, {bubbles:true,cancelable:true});
    Object.keys(info).forEach((field)=>{
      e[field] = info[field];
    });
    return e;
  }
  
  var touchInterface = false;

  var tapTimeThreshold = 300; // max milliseconds for tap to go from touchstart to touchend
  var tapDistanceThreshold = 8; //  max pixels for tap to move between touchstart and touch end
  var doubletapTimeThreshold = 300;
  var doubletapDistanceThreshold = 8;

  var holdTimeThreshold = 500;

  function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
  }

  var lastTapData = {
    time : -Infinity
  };

  window.addEventListener('touchstart', function (startEvent) {
    touchInterface = true;
    var startTime = (new Date()).getTime();
    var x1 = startEvent.touches[0].pageX;
    var y1 = startEvent.touches[0].pageY;

    var holdTimeout = setTimeout(function () {
      var holdEvent = customEvent('hold', {
        x : x1,
        y : y1
      });
      startEvent.target.dispatchEvent(holdEvent);
    }, holdTimeThreshold);

    once(window, 'touchmove', function () {
      clearTimeout(holdTimeout);
    });

    var touchEvent = customEvent('touch', {
      x : x1,
      y : y1,
      fingers : startEvent.touches.length
    });
    startEvent.target.dispatchEvent(touchEvent);

    once(window, 'touchend touchcancel', function (endEvent) {
      clearTimeout(holdTimeout);
      var x2 = endEvent.changedTouches[0].pageX;
      var y2 = endEvent.changedTouches[0].pageY;
      var withinTimeThreshold = (new Date()).getTime() - startTime < tapTimeThreshold;
      var withinDistanceThreshold = Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2)) < tapDistanceThreshold;
      var sameTarget = startEvent.target === endEvent.target;

      if (sameTarget
      &&  withinTimeThreshold
      &&  withinDistanceThreshold) {
        var tapData = {
          x : x1,
          y : y1,
          time : Date.now()
        };
        var tapEvent = customEvent('tap', tapData);
        endEvent.target.dispatchEvent(tapEvent);
        var tapDistance = distance(x1, y1, lastTapData.x, lastTapData.y);
        if (tapData.time - lastTapData.time < doubletapTimeThreshold && tapDistance < doubletapDistanceThreshold) {
          var doubletapEvent = customEvent('doubletap', tapData);
          startEvent.target.dispatchEvent(doubletapEvent);
        }
        lastTapData = tapData;
      }
    });
  });

  var dragging = false;

  window.addEventListener('mousewheel', function (event) {});

  window.addEventListener('mouseenter', function (event) {
    if (!dragging) {
      var hoverEvent = customEvent('hover', {
        x : event.pageX,
        y : event.pageY
      });
      event.target.dispatchEvent(hoverEvent);
    }
  });

  window.addEventListener('mouseout', function (event) {
      var leaveEvent = customEvent('leave', {});
      event.target.dispatchEvent(leaveEvent);
  });

  window.addEventListener('mousedown', function (startEvent) {
    if (touchInterface) return;
    var startTime = (new Date()).getTime();
    var x1 = startEvent.pageX;
    var y1 = startEvent.pageY;

    var holdTimeout = setTimeout(function () {
      var holdEvent = customEvent('hold', {
        x : x1,
        y : y1
      });
      startEvent.target.dispatchEvent(holdEvent);
    }, holdTimeThreshold);

    var touchEvent = customEvent('touch', {
      x : x1,
      y : y1,
      fingers : 1
    });
    startEvent.target.dispatchEvent(touchEvent);

    once(window, 'mousemove', function () {
      clearTimeout(holdTimeout);
    });

    once(window, 'mouseup', function (endEvent) {
      clearTimeout(holdTimeout);
      var x2 = endEvent.pageX;
      var y2 = endEvent.pageY;
      var withinTimeThreshold = (new Date()).getTime() - startTime < tapTimeThreshold;
      var withinDistanceThreshold = Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2)) < tapDistanceThreshold;
      var sameTarget = startEvent.target === endEvent.target;

      if (sameTarget
      &&  withinTimeThreshold
      &&  withinDistanceThreshold) {
        var tapData = {
          x : x1,
          y : y1,
          time : Date.now()
        };
        var tapEvent = customEvent('tap', tapData);
        endEvent.target.dispatchEvent(tapEvent);
        var tapDistance = distance(x1, y1, lastTapData.x, lastTapData.y);
        if (tapData.time - lastTapData.time < doubletapTimeThreshold && tapDistance < doubletapDistanceThreshold) {
          var doubletapEvent = customEvent('doubletap', tapData);
          startEvent.target.dispatchEvent(doubletapEvent);
        }
        lastTapData = tapData;
      }
    });
  });

  //  TODO: enable/disable wheel === pinch... behaviour at consumer level
  window.addEventListener('wheel', function (event) {
    var scale;
    if (event.deltaY > 0) {
      scale = 1.05;
    }
    else {
      scale = 1/1.05;
    }
    var pinchEvent = customEvent('pinch', {
      scale : scale,
      x : event.pageX,
      y : event.pageY
    });
    event.target.dispatchEvent(pinchEvent);
  });

  window.addEventListener('touchstart', function (startEvent) {
    var startX = startEvent.touches[0].pageX;
    var startY = startEvent.touches[0].pageY;
    //  last 5 velocities recorded in x direction
    var vx = [0,0,0,0,0];
    var lastT = new Date();
    var lastD = 0;
    var firstD = 0;

    if (startEvent.touches.length === 1) {
      // okay
    }
    else if (startEvent.touches.length === 2) {
      var x1 = startX;
      var y1 = startY;
      var x2 = startEvent.touches[1].pageX;
      var y2 = startEvent.touches[1].pageY;

      firstD = distance(x1, y1, x2, y2);
      lastD = firstD;

      startX = (x1 + x2)/2;
      startY = (y1 + y2)/2;
    }
    else {
      //  unsupported number of touches
      return;
    }

    var lastX = startX;
    var lastY = startY;

    function drag(moveEvent) {
      var x = moveEvent.touches[0].pageX;
      var y = moveEvent.touches[0].pageY;
      var t = new Date();
      var pinchEvent;

      if (startEvent.touches.length === 2) {
        var x1 = x;
        var y1 = y;
        var x2 = moveEvent.touches[1].pageX;
        var y2 = moveEvent.touches[1].pageY;

        x = (x1 + x2)/2;
        y = (y1 + y2)/2;

        var d = distance(x1, y1, x2, y2);

        pinchEvent = customEvent('pinch', {
          scale : d/lastD,
          x : x,
          y : y
        });

        lastD = d;
      }

      var dx = x - lastX;
      var dy = y - lastY;
      var dragEvent = customEvent('onedrag', {
        dx : dx,
        dy : dy,
        tx : x - startX,
        ty : y - startY,
        sx : startX,
        sy : startY,
        x : x,
        y : y,
        fingers : startEvent.touches.length
      });

      moveEvent.target.dispatchEvent(dragEvent);
      if (pinchEvent) moveEvent.target.dispatchEvent(pinchEvent);

      vx.shift();
      vx.push(dx / (t - lastT));

      lastX = x;
      lastY = y;
      lastT = t;
    }

    window.addEventListener('touchmove', drag);

    once(window, 'touchstart touchend touchcancel', function (endEvent) {
      window.removeEventListener('touchmove', drag);
    });

    once(window, 'touchend', function (endEvent) {
      var swiped;
      vx.sort();
      var medianVx = vx[2];
      if (medianVx > 0.5) {
        swiped = 'right';
        var swiperightEvent = customEvent('swiperight', {
          vx : medianVx
        });
        endEvent.target.dispatchEvent(swiperightEvent);
      }
      else if (medianVx < -0.5) {
        swiped = 'left';
        var swipeleftEvent = customEvent('swipeleft', {
          vx : medianVx
        });
        endEvent.target.dispatchEvent(swipeleftEvent);
      }
      var dropEvent = customEvent('drop', {
        dx : lastX,
        dy : lastY,
        swiped : swiped
      });
      startEvent.target.dispatchEvent(dropEvent);
    });
  });


  window.addEventListener('mousedown', function (startEvent) {
    var startTarget = startEvent.target;
    var startX = startEvent.pageX;
    var startY = startEvent.pageY;
    //  last 5 velocities recorded in x direction
    var vx = [0,0,0,0,0];
    var lastT = new Date();

    var lastX = startX;
    var lastY = startY;

    function drag(moveEvent) {
      dragging = true;

      var x = moveEvent.pageX;
      var y = moveEvent.pageY;
      var t = new Date();

      var dx = x - lastX;
      var dy = y - lastY;
      var dragEvent = customEvent('onedrag', {
        dx : dx,
        dy : dy,
        tx : x - startX,
        ty : y - startY,
        sx : startX,
        sy : startY,
        x : x,
        y : y,
        fingers : 1
      });

      startTarget.dispatchEvent(dragEvent);

      vx.shift();
      vx.push(dx / (t - lastT));

      lastX = x;
      lastY = y;
      lastT = t;
    }

    window.addEventListener('mousemove', drag);

    once(window, 'mouseup', function (endEvent) {
      window.removeEventListener('mousemove', drag);

      //  no drop unless dragged
      if (!dragging) return;

      dragging = false;
      vx.sort();
      var medianVx = vx[2];
      var swiped;
      if (medianVx > 0.5) {
        swiped = 'right';
        var swiperightEvent = customEvent('swiperight', {
          vx : medianVx
        });
        startTarget.dispatchEvent(swiperightEvent);
      }
      else if (medianVx < -0.5) {
        swiped = 'left';
        var swipeleftEvent = customEvent('swipeleft', {
          vx : medianVx
        });
        startTarget.dispatchEvent(swipeleftEvent);
      }
      var dropEvent = customEvent('drop', {
        x : lastX,
        y : lastY,
        dx : lastX - startX,
        dy : lastY - startY,
        swiped : swiped
      });
      startTarget.dispatchEvent(dropEvent);
    });
  });
});