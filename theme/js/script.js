(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
//
// SmoothScroll for websites v1.4.10 (Balazs Galambosi)
// http://www.smoothscroll.net/
//
// Licensed under the terms of the MIT license.
//
// You may use it in your theme if you credit me. 
// It is also free to use on any individual website.
//
// Exception:
// The only restriction is to not publish any  
// extension for browsers or native application
// without getting a written permission first.
//

(function () {
  
// Scroll Variables (tweakable)
var defaultOptions = {

    // Scrolling Core
    frameRate        : 150, // [Hz]
    animationTime    : 400, // [ms]
    stepSize         : 100, // [px]

    // Pulse (less tweakable)
    // ratio of "tail" to "acceleration"
    pulseAlgorithm   : true,
    pulseScale       : 4,
    pulseNormalize   : 1,

    // Acceleration
    accelerationDelta : 50,  // 50
    accelerationMax   : 3,   // 3

    // Keyboard Settings
    keyboardSupport   : true,  // option
    arrowScroll       : 50,    // [px]

    // Other
    fixedBackground   : true, 
    excluded          : ''    
};

var options = defaultOptions;


// Other Variables
var isExcluded = false;
var isFrame = false;
var direction = { x: 0, y: 0 };
var initDone  = false;
var root = document.documentElement;
var activeElement;
var observer;
var refreshSize;
var deltaBuffer = [];
var deltaBufferTimer;
var isMac = /^Mac/.test(navigator.platform);

var key = { left: 37, up: 38, right: 39, down: 40, spacebar: 32, 
            pageup: 33, pagedown: 34, end: 35, home: 36 };
var arrowKeys = { 37: 1, 38: 1, 39: 1, 40: 1 };

/***********************************************
 * INITIALIZE
 ***********************************************/

/**
 * Tests if smooth scrolling is allowed. Shuts down everything if not.
 */
function initTest() {
    if (options.keyboardSupport) {
        addEvent('keydown', keydown);
    }
}

/**
 * Sets up scrolls array, determines if frames are involved.
 */
function init() {
  
    if (initDone || !document.body) return;

    initDone = true;

    var body = document.body;
    var html = document.documentElement;
    var windowHeight = window.innerHeight; 
    var scrollHeight = body.scrollHeight;
    
    // check compat mode for root element
    root = (document.compatMode.indexOf('CSS') >= 0) ? html : body;
    activeElement = body;
    
    initTest();

    // Checks if this script is running in a frame
    if (top != self) {
        isFrame = true;
    }

    /**
     * Safari 10 fixed it, Chrome fixed it in v45:
     * This fixes a bug where the areas left and right to 
     * the content does not trigger the onmousewheel event
     * on some pages. e.g.: html, body { height: 100% }
     */
    else if (isOldSafari &&
             scrollHeight > windowHeight &&
            (body.offsetHeight <= windowHeight || 
             html.offsetHeight <= windowHeight)) {

        var fullPageElem = document.createElement('div');
        fullPageElem.style.cssText = 'position:absolute; z-index:-10000; ' +
                                     'top:0; left:0; right:0; height:' + 
                                      root.scrollHeight + 'px';
        document.body.appendChild(fullPageElem);
        
        // DOM changed (throttled) to fix height
        var pendingRefresh;
        refreshSize = function () {
            if (pendingRefresh) return; // could also be: clearTimeout(pendingRefresh);
            pendingRefresh = setTimeout(function () {
                if (isExcluded) return; // could be running after cleanup
                fullPageElem.style.height = '0';
                fullPageElem.style.height = root.scrollHeight + 'px';
                pendingRefresh = null;
            }, 500); // act rarely to stay fast
        };
  
        setTimeout(refreshSize, 10);

        addEvent('resize', refreshSize);

        // TODO: attributeFilter?
        var config = {
            attributes: true, 
            childList: true, 
            characterData: false 
            // subtree: true
        };

        observer = new MutationObserver(refreshSize);
        observer.observe(body, config);

        if (root.offsetHeight <= windowHeight) {
            var clearfix = document.createElement('div');   
            clearfix.style.clear = 'both';
            body.appendChild(clearfix);
        }
    }

    // disable fixed background
    if (!options.fixedBackground && !isExcluded) {
        body.style.backgroundAttachment = 'scroll';
        html.style.backgroundAttachment = 'scroll';
    }
}

/**
 * Removes event listeners and other traces left on the page.
 */
function cleanup() {
    observer && observer.disconnect();
    removeEvent(wheelEvent, wheel);
    removeEvent('mousedown', mousedown);
    removeEvent('keydown', keydown);
    removeEvent('resize', refreshSize);
    removeEvent('load', init);
}


/************************************************
 * SCROLLING 
 ************************************************/
 
var que = [];
var pending = false;
var lastScroll = Date.now();

/**
 * Pushes scroll actions to the scrolling queue.
 */
function scrollArray(elem, left, top) {
    
    directionCheck(left, top);

    if (options.accelerationMax != 1) {
        var now = Date.now();
        var elapsed = now - lastScroll;
        if (elapsed < options.accelerationDelta) {
            var factor = (1 + (50 / elapsed)) / 2;
            if (factor > 1) {
                factor = Math.min(factor, options.accelerationMax);
                left *= factor;
                top  *= factor;
            }
        }
        lastScroll = Date.now();
    }          
    
    // push a scroll command
    que.push({
        x: left, 
        y: top, 
        lastX: (left < 0) ? 0.99 : -0.99,
        lastY: (top  < 0) ? 0.99 : -0.99, 
        start: Date.now()
    });
        
    // don't act if there's a pending queue
    if (pending) {
        return;
    }  

    var scrollRoot = getScrollRoot();
    var isWindowScroll = (elem === scrollRoot || elem === document.body);
    
    // if we haven't already fixed the behavior, 
    // and it needs fixing for this sesh
    if (elem.$scrollBehavior == null && isScrollBehaviorSmooth(elem)) {
        elem.$scrollBehavior = elem.style.scrollBehavior;
        elem.style.scrollBehavior = 'auto';
    }

    var step = function (time) {
        
        var now = Date.now();
        var scrollX = 0;
        var scrollY = 0; 
    
        for (var i = 0; i < que.length; i++) {
            
            var item = que[i];
            var elapsed  = now - item.start;
            var finished = (elapsed >= options.animationTime);
            
            // scroll position: [0, 1]
            var position = (finished) ? 1 : elapsed / options.animationTime;
            
            // easing [optional]
            if (options.pulseAlgorithm) {
                position = pulse(position);
            }
            
            // only need the difference
            var x = (item.x * position - item.lastX) >> 0;
            var y = (item.y * position - item.lastY) >> 0;
            
            // add this to the total scrolling
            scrollX += x;
            scrollY += y;            
            
            // update last values
            item.lastX += x;
            item.lastY += y;
        
            // delete and step back if it's over
            if (finished) {
                que.splice(i, 1); i--;
            }           
        }

        // scroll left and top
        if (isWindowScroll) {
            window.scrollBy(scrollX, scrollY);
        } 
        else {
            if (scrollX) elem.scrollLeft += scrollX;
            if (scrollY) elem.scrollTop  += scrollY;                    
        }
        
        // clean up if there's nothing left to do
        if (!left && !top) {
            que = [];
        }
        
        if (que.length) { 
            requestFrame(step, elem, (1000 / options.frameRate + 1)); 
        } else { 
            pending = false;
            // restore default behavior at the end of scrolling sesh
            if (elem.$scrollBehavior != null) {
                elem.style.scrollBehavior = elem.$scrollBehavior;
                elem.$scrollBehavior = null;
            }
        }
    };
    
    // start a new queue of actions
    requestFrame(step, elem, 0);
    pending = true;
}


/***********************************************
 * EVENTS
 ***********************************************/

/**
 * Mouse wheel handler.
 * @param {Object} event
 */
function wheel(event) {

    if (!initDone) {
        init();
    }
    
    var target = event.target;

    // leave early if default action is prevented   
    // or it's a zooming event with CTRL 
    if (event.defaultPrevented || event.ctrlKey) {
        return true;
    }
    
    // leave embedded content alone (flash & pdf)
    if (isNodeName(activeElement, 'embed') || 
       (isNodeName(target, 'embed') && /\.pdf/i.test(target.src)) ||
        isNodeName(activeElement, 'object') ||
        target.shadowRoot) {
        return true;
    }

    var deltaX = -event.wheelDeltaX || event.deltaX || 0;
    var deltaY = -event.wheelDeltaY || event.deltaY || 0;
    
    if (isMac) {
        if (event.wheelDeltaX && isDivisible(event.wheelDeltaX, 120)) {
            deltaX = -120 * (event.wheelDeltaX / Math.abs(event.wheelDeltaX));
        }
        if (event.wheelDeltaY && isDivisible(event.wheelDeltaY, 120)) {
            deltaY = -120 * (event.wheelDeltaY / Math.abs(event.wheelDeltaY));
        }
    }
    
    // use wheelDelta if deltaX/Y is not available
    if (!deltaX && !deltaY) {
        deltaY = -event.wheelDelta || 0;
    }

    // line based scrolling (Firefox mostly)
    if (event.deltaMode === 1) {
        deltaX *= 40;
        deltaY *= 40;
    }

    var overflowing = overflowingAncestor(target);

    // nothing to do if there's no element that's scrollable
    if (!overflowing) {
        // except Chrome iframes seem to eat wheel events, which we need to 
        // propagate up, if the iframe has nothing overflowing to scroll
        if (isFrame && isChrome)  {
            // change target to iframe element itself for the parent frame
            Object.defineProperty(event, "target", {value: window.frameElement});
            return parent.wheel(event);
        }
        return true;
    }
    
    // check if it's a touchpad scroll that should be ignored
    if (isTouchpad(deltaY)) {
        return true;
    }

    // scale by step size
    // delta is 120 most of the time
    // synaptics seems to send 1 sometimes
    if (Math.abs(deltaX) > 1.2) {
        deltaX *= options.stepSize / 120;
    }
    if (Math.abs(deltaY) > 1.2) {
        deltaY *= options.stepSize / 120;
    }
    
    scrollArray(overflowing, deltaX, deltaY);
    event.preventDefault();
    scheduleClearCache();
}

/**
 * Keydown event handler.
 * @param {Object} event
 */
function keydown(event) {

    var target   = event.target;
    var modifier = event.ctrlKey || event.altKey || event.metaKey || 
                  (event.shiftKey && event.keyCode !== key.spacebar);
    
    // our own tracked active element could've been removed from the DOM
    if (!document.body.contains(activeElement)) {
        activeElement = document.activeElement;
    }

    // do nothing if user is editing text
    // or using a modifier key (except shift)
    // or in a dropdown
    // or inside interactive elements
    var inputNodeNames = /^(textarea|select|embed|object)$/i;
    var buttonTypes = /^(button|submit|radio|checkbox|file|color|image)$/i;
    if ( event.defaultPrevented ||
         inputNodeNames.test(target.nodeName) ||
         isNodeName(target, 'input') && !buttonTypes.test(target.type) ||
         isNodeName(activeElement, 'video') ||
         isInsideYoutubeVideo(event) ||
         target.isContentEditable || 
         modifier ) {
      return true;
    }

    // [spacebar] should trigger button press, leave it alone
    if ((isNodeName(target, 'button') ||
         isNodeName(target, 'input') && buttonTypes.test(target.type)) &&
        event.keyCode === key.spacebar) {
      return true;
    }

    // [arrwow keys] on radio buttons should be left alone
    if (isNodeName(target, 'input') && target.type == 'radio' &&
        arrowKeys[event.keyCode])  {
      return true;
    }
    
    var shift, x = 0, y = 0;
    var overflowing = overflowingAncestor(activeElement);

    if (!overflowing) {
        // Chrome iframes seem to eat key events, which we need to 
        // propagate up, if the iframe has nothing overflowing to scroll
        return (isFrame && isChrome) ? parent.keydown(event) : true;
    }

    var clientHeight = overflowing.clientHeight; 

    if (overflowing == document.body) {
        clientHeight = window.innerHeight;
    }

    switch (event.keyCode) {
        case key.up:
            y = -options.arrowScroll;
            break;
        case key.down:
            y = options.arrowScroll;
            break;         
        case key.spacebar: // (+ shift)
            shift = event.shiftKey ? 1 : -1;
            y = -shift * clientHeight * 0.9;
            break;
        case key.pageup:
            y = -clientHeight * 0.9;
            break;
        case key.pagedown:
            y = clientHeight * 0.9;
            break;
        case key.home:
            if (overflowing == document.body && document.scrollingElement)
                overflowing = document.scrollingElement;
            y = -overflowing.scrollTop;
            break;
        case key.end:
            var scroll = overflowing.scrollHeight - overflowing.scrollTop;
            var scrollRemaining = scroll - clientHeight;
            y = (scrollRemaining > 0) ? scrollRemaining + 10 : 0;
            break;
        case key.left:
            x = -options.arrowScroll;
            break;
        case key.right:
            x = options.arrowScroll;
            break;            
        default:
            return true; // a key we don't care about
    }

    scrollArray(overflowing, x, y);
    event.preventDefault();
    scheduleClearCache();
}

/**
 * Mousedown event only for updating activeElement
 */
function mousedown(event) {
    activeElement = event.target;
}


/***********************************************
 * OVERFLOW
 ***********************************************/

var uniqueID = (function () {
    var i = 0;
    return function (el) {
        return el.uniqueID || (el.uniqueID = i++);
    };
})();

var cacheX = {}; // cleared out after a scrolling session
var cacheY = {}; // cleared out after a scrolling session
var clearCacheTimer;
var smoothBehaviorForElement = {};

//setInterval(function () { cache = {}; }, 10 * 1000);

function scheduleClearCache() {
    clearTimeout(clearCacheTimer);
    clearCacheTimer = setInterval(function () { 
        cacheX = cacheY = smoothBehaviorForElement = {}; 
    }, 1*1000);
}

function setCache(elems, overflowing, x) {
    var cache = x ? cacheX : cacheY;
    for (var i = elems.length; i--;)
        cache[uniqueID(elems[i])] = overflowing;
    return overflowing;
}

function getCache(el, x) {
    return (x ? cacheX : cacheY)[uniqueID(el)];
}

//  (body)                (root)
//         | hidden | visible | scroll |  auto  |
// hidden  |   no   |    no   |   YES  |   YES  |
// visible |   no   |   YES   |   YES  |   YES  |
// scroll  |   no   |   YES   |   YES  |   YES  |
// auto    |   no   |   YES   |   YES  |   YES  |

function overflowingAncestor(el) {
    var elems = [];
    var body = document.body;
    var rootScrollHeight = root.scrollHeight;
    do {
        var cached = getCache(el, false);
        if (cached) {
            return setCache(elems, cached);
        }
        elems.push(el);
        if (rootScrollHeight === el.scrollHeight) {
            var topOverflowsNotHidden = overflowNotHidden(root) && overflowNotHidden(body);
            var isOverflowCSS = topOverflowsNotHidden || overflowAutoOrScroll(root);
            if (isFrame && isContentOverflowing(root) || 
               !isFrame && isOverflowCSS) {
                return setCache(elems, getScrollRoot()); 
            }
        } else if (isContentOverflowing(el) && overflowAutoOrScroll(el)) {
            return setCache(elems, el);
        }
    } while ((el = el.parentElement));
}

function isContentOverflowing(el) {
    return (el.clientHeight + 10 < el.scrollHeight);
}

// typically for <body> and <html>
function overflowNotHidden(el) {
    var overflow = getComputedStyle(el, '').getPropertyValue('overflow-y');
    return (overflow !== 'hidden');
}

// for all other elements
function overflowAutoOrScroll(el) {
    var overflow = getComputedStyle(el, '').getPropertyValue('overflow-y');
    return (overflow === 'scroll' || overflow === 'auto');
}

// for all other elements
function isScrollBehaviorSmooth(el) {
    var id = uniqueID(el);
    if (smoothBehaviorForElement[id] == null) {
        var scrollBehavior = getComputedStyle(el, '')['scroll-behavior'];
        smoothBehaviorForElement[id] = ('smooth' == scrollBehavior);
    }
    return smoothBehaviorForElement[id];
}


/***********************************************
 * HELPERS
 ***********************************************/

function addEvent(type, fn, arg) {
    window.addEventListener(type, fn, arg || false);
}

function removeEvent(type, fn, arg) {
    window.removeEventListener(type, fn, arg || false);  
}

function isNodeName(el, tag) {
    return el && (el.nodeName||'').toLowerCase() === tag.toLowerCase();
}

function directionCheck(x, y) {
    x = (x > 0) ? 1 : -1;
    y = (y > 0) ? 1 : -1;
    if (direction.x !== x || direction.y !== y) {
        direction.x = x;
        direction.y = y;
        que = [];
        lastScroll = 0;
    }
}

if (window.localStorage && localStorage.SS_deltaBuffer) {
    try { // #46 Safari throws in private browsing for localStorage 
        deltaBuffer = localStorage.SS_deltaBuffer.split(',');
    } catch (e) { } 
}

function isTouchpad(deltaY) {
    if (!deltaY) return;
    if (!deltaBuffer.length) {
        deltaBuffer = [deltaY, deltaY, deltaY];
    }
    deltaY = Math.abs(deltaY);
    deltaBuffer.push(deltaY);
    deltaBuffer.shift();
    clearTimeout(deltaBufferTimer);
    deltaBufferTimer = setTimeout(function () {
        try { // #46 Safari throws in private browsing for localStorage
            localStorage.SS_deltaBuffer = deltaBuffer.join(',');
        } catch (e) { }  
    }, 1000);
    var dpiScaledWheelDelta = deltaY > 120 && allDeltasDivisableBy(deltaY); // win64 
    var tp = !allDeltasDivisableBy(120) && !allDeltasDivisableBy(100) && !dpiScaledWheelDelta;
    if (deltaY < 50) return true;
    return tp;
} 

function isDivisible(n, divisor) {
    return (Math.floor(n / divisor) == n / divisor);
}

function allDeltasDivisableBy(divisor) {
    return (isDivisible(deltaBuffer[0], divisor) &&
            isDivisible(deltaBuffer[1], divisor) &&
            isDivisible(deltaBuffer[2], divisor));
}

function isInsideYoutubeVideo(event) {
    var elem = event.target;
    var isControl = false;
    if (document.URL.indexOf ('www.youtube.com/watch') != -1) {
        do {
            isControl = (elem.classList && 
                         elem.classList.contains('html5-video-controls'));
            if (isControl) break;
        } while ((elem = elem.parentNode));
    }
    return isControl;
}

var requestFrame = (function () {
      return (window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    ||
              function (callback, element, delay) {
                 window.setTimeout(callback, delay || (1000/60));
             });
})();

var MutationObserver = (window.MutationObserver || 
                        window.WebKitMutationObserver ||
                        window.MozMutationObserver);  

var getScrollRoot = (function() {
  var SCROLL_ROOT = document.scrollingElement;
  return function() {
    if (!SCROLL_ROOT) {
      var dummy = document.createElement('div');
      dummy.style.cssText = 'height:10000px;width:1px;';
      document.body.appendChild(dummy);
      var bodyScrollTop  = document.body.scrollTop;
      var docElScrollTop = document.documentElement.scrollTop;
      window.scrollBy(0, 3);
      if (document.body.scrollTop != bodyScrollTop)
        (SCROLL_ROOT = document.body);
      else 
        (SCROLL_ROOT = document.documentElement);
      window.scrollBy(0, -3);
      document.body.removeChild(dummy);
    }
    return SCROLL_ROOT;
  };
})();


/***********************************************
 * PULSE (by Michael Herf)
 ***********************************************/
 
/**
 * Viscous fluid with a pulse for part and decay for the rest.
 * - Applies a fixed force over an interval (a damped acceleration), and
 * - Lets the exponential bleed away the velocity over a longer interval
 * - Michael Herf, http://stereopsis.com/stopping/
 */
function pulse_(x) {
    var val, start, expx;
    // test
    x = x * options.pulseScale;
    if (x < 1) { // acceleartion
        val = x - (1 - Math.exp(-x));
    } else {     // tail
        // the previous animation ended here:
        start = Math.exp(-1);
        // simple viscous drag
        x -= 1;
        expx = 1 - Math.exp(-x);
        val = start + (expx * (1 - start));
    }
    return val * options.pulseNormalize;
}

function pulse(x) {
    if (x >= 1) return 1;
    if (x <= 0) return 0;

    if (options.pulseNormalize == 1) {
        options.pulseNormalize /= pulse_(1);
    }
    return pulse_(x);
}


/***********************************************
 * FIRST RUN
 ***********************************************/

var userAgent = window.navigator.userAgent;
var isEdge    = /Edge/.test(userAgent); // thank you MS
var isChrome  = /chrome/i.test(userAgent) && !isEdge; 
var isSafari  = /safari/i.test(userAgent) && !isEdge; 
var isMobile  = /mobile/i.test(userAgent);
var isIEWin7  = /Windows NT 6.1/i.test(userAgent) && /rv:11/i.test(userAgent);
var isOldSafari = isSafari && (/Version\/8/i.test(userAgent) || /Version\/9/i.test(userAgent));
var isEnabledForBrowser = (isChrome || isSafari || isIEWin7) && !isMobile;

var supportsPassive = false;
try {
  window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
    get: function () {
            supportsPassive = true;
        } 
    }));
} catch(e) {}

var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel'; 

if (wheelEvent && isEnabledForBrowser) {
    addEvent(wheelEvent, wheel, wheelOpt);
    addEvent('mousedown', mousedown);
    addEvent('load', init);
}


/***********************************************
 * PUBLIC INTERFACE
 ***********************************************/

function SmoothScroll(optionsToSet) {
    for (var key in optionsToSet)
        if (defaultOptions.hasOwnProperty(key)) 
            options[key] = optionsToSet[key];
}
SmoothScroll.destroy = cleanup;

if (window.SmoothScrollOptions) // async API
    SmoothScroll(window.SmoothScrollOptions);

if (typeof define === 'function' && define.amd)
    define(function() {
        return SmoothScroll;
    });
else if ('object' == typeof exports)
    module.exports = SmoothScroll;
else
    window.SmoothScroll = SmoothScroll;

})();

},{}],2:[function(require,module,exports){
(function() {
  var MutationObserver, Util, WeakMap, getComputedStyle, getComputedStyleRX,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Util = (function() {
    function Util() {}

    Util.prototype.extend = function(custom, defaults) {
      var key, value;
      for (key in defaults) {
        value = defaults[key];
        if (custom[key] == null) {
          custom[key] = value;
        }
      }
      return custom;
    };

    Util.prototype.isMobile = function(agent) {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(agent);
    };

    Util.prototype.createEvent = function(event, bubble, cancel, detail) {
      var customEvent;
      if (bubble == null) {
        bubble = false;
      }
      if (cancel == null) {
        cancel = false;
      }
      if (detail == null) {
        detail = null;
      }
      if (document.createEvent != null) {
        customEvent = document.createEvent('CustomEvent');
        customEvent.initCustomEvent(event, bubble, cancel, detail);
      } else if (document.createEventObject != null) {
        customEvent = document.createEventObject();
        customEvent.eventType = event;
      } else {
        customEvent.eventName = event;
      }
      return customEvent;
    };

    Util.prototype.emitEvent = function(elem, event) {
      if (elem.dispatchEvent != null) {
        return elem.dispatchEvent(event);
      } else if (event in (elem != null)) {
        return elem[event]();
      } else if (("on" + event) in (elem != null)) {
        return elem["on" + event]();
      }
    };

    Util.prototype.addEvent = function(elem, event, fn) {
      if (elem.addEventListener != null) {
        return elem.addEventListener(event, fn, false);
      } else if (elem.attachEvent != null) {
        return elem.attachEvent("on" + event, fn);
      } else {
        return elem[event] = fn;
      }
    };

    Util.prototype.removeEvent = function(elem, event, fn) {
      if (elem.removeEventListener != null) {
        return elem.removeEventListener(event, fn, false);
      } else if (elem.detachEvent != null) {
        return elem.detachEvent("on" + event, fn);
      } else {
        return delete elem[event];
      }
    };

    Util.prototype.innerHeight = function() {
      if ('innerHeight' in window) {
        return window.innerHeight;
      } else {
        return document.documentElement.clientHeight;
      }
    };

    return Util;

  })();

  WeakMap = this.WeakMap || this.MozWeakMap || (WeakMap = (function() {
    function WeakMap() {
      this.keys = [];
      this.values = [];
    }

    WeakMap.prototype.get = function(key) {
      var i, item, j, len, ref;
      ref = this.keys;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        item = ref[i];
        if (item === key) {
          return this.values[i];
        }
      }
    };

    WeakMap.prototype.set = function(key, value) {
      var i, item, j, len, ref;
      ref = this.keys;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        item = ref[i];
        if (item === key) {
          this.values[i] = value;
          return;
        }
      }
      this.keys.push(key);
      return this.values.push(value);
    };

    return WeakMap;

  })());

  MutationObserver = this.MutationObserver || this.WebkitMutationObserver || this.MozMutationObserver || (MutationObserver = (function() {
    function MutationObserver() {
      if (typeof console !== "undefined" && console !== null) {
        console.warn('MutationObserver is not supported by your browser.');
      }
      if (typeof console !== "undefined" && console !== null) {
        console.warn('WOW.js cannot detect dom mutations, please call .sync() after loading new content.');
      }
    }

    MutationObserver.notSupported = true;

    MutationObserver.prototype.observe = function() {};

    return MutationObserver;

  })());

  getComputedStyle = this.getComputedStyle || function(el, pseudo) {
    this.getPropertyValue = function(prop) {
      var ref;
      if (prop === 'float') {
        prop = 'styleFloat';
      }
      if (getComputedStyleRX.test(prop)) {
        prop.replace(getComputedStyleRX, function(_, _char) {
          return _char.toUpperCase();
        });
      }
      return ((ref = el.currentStyle) != null ? ref[prop] : void 0) || null;
    };
    return this;
  };

  getComputedStyleRX = /(\-([a-z]){1})/g;

  this.WOW = (function() {
    WOW.prototype.defaults = {
      boxClass: 'wow',
      animateClass: 'animated',
      offset: 0,
      mobile: true,
      live: true,
      callback: null,
      scrollContainer: null
    };

    function WOW(options) {
      if (options == null) {
        options = {};
      }
      this.scrollCallback = bind(this.scrollCallback, this);
      this.scrollHandler = bind(this.scrollHandler, this);
      this.resetAnimation = bind(this.resetAnimation, this);
      this.start = bind(this.start, this);
      this.scrolled = true;
      this.config = this.util().extend(options, this.defaults);
      if (options.scrollContainer != null) {
        this.config.scrollContainer = document.querySelector(options.scrollContainer);
      }
      this.animationNameCache = new WeakMap();
      this.wowEvent = this.util().createEvent(this.config.boxClass);
    }

    WOW.prototype.init = function() {
      var ref;
      this.element = window.document.documentElement;
      if ((ref = document.readyState) === "interactive" || ref === "complete") {
        this.start();
      } else {
        this.util().addEvent(document, 'DOMContentLoaded', this.start);
      }
      return this.finished = [];
    };

    WOW.prototype.start = function() {
      var box, j, len, ref;
      this.stopped = false;
      this.boxes = (function() {
        var j, len, ref, results;
        ref = this.element.querySelectorAll("." + this.config.boxClass);
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          box = ref[j];
          results.push(box);
        }
        return results;
      }).call(this);
      this.all = (function() {
        var j, len, ref, results;
        ref = this.boxes;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          box = ref[j];
          results.push(box);
        }
        return results;
      }).call(this);
      if (this.boxes.length) {
        if (this.disabled()) {
          this.resetStyle();
        } else {
          ref = this.boxes;
          for (j = 0, len = ref.length; j < len; j++) {
            box = ref[j];
            this.applyStyle(box, true);
          }
        }
      }
      if (!this.disabled()) {
        this.util().addEvent(this.config.scrollContainer || window, 'scroll', this.scrollHandler);
        this.util().addEvent(window, 'resize', this.scrollHandler);
        this.interval = setInterval(this.scrollCallback, 50);
      }
      if (this.config.live) {
        return new MutationObserver((function(_this) {
          return function(records) {
            var k, len1, node, record, results;
            results = [];
            for (k = 0, len1 = records.length; k < len1; k++) {
              record = records[k];
              results.push((function() {
                var l, len2, ref1, results1;
                ref1 = record.addedNodes || [];
                results1 = [];
                for (l = 0, len2 = ref1.length; l < len2; l++) {
                  node = ref1[l];
                  results1.push(this.doSync(node));
                }
                return results1;
              }).call(_this));
            }
            return results;
          };
        })(this)).observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    };

    WOW.prototype.stop = function() {
      this.stopped = true;
      this.util().removeEvent(this.config.scrollContainer || window, 'scroll', this.scrollHandler);
      this.util().removeEvent(window, 'resize', this.scrollHandler);
      if (this.interval != null) {
        return clearInterval(this.interval);
      }
    };

    WOW.prototype.sync = function(element) {
      if (MutationObserver.notSupported) {
        return this.doSync(this.element);
      }
    };

    WOW.prototype.doSync = function(element) {
      var box, j, len, ref, results;
      if (element == null) {
        element = this.element;
      }
      if (element.nodeType !== 1) {
        return;
      }
      element = element.parentNode || element;
      ref = element.querySelectorAll("." + this.config.boxClass);
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        box = ref[j];
        if (indexOf.call(this.all, box) < 0) {
          this.boxes.push(box);
          this.all.push(box);
          if (this.stopped || this.disabled()) {
            this.resetStyle();
          } else {
            this.applyStyle(box, true);
          }
          results.push(this.scrolled = true);
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    WOW.prototype.show = function(box) {
      this.applyStyle(box);
      box.className = box.className + " " + this.config.animateClass;
      if (this.config.callback != null) {
        this.config.callback(box);
      }
      this.util().emitEvent(box, this.wowEvent);
      this.util().addEvent(box, 'animationend', this.resetAnimation);
      this.util().addEvent(box, 'oanimationend', this.resetAnimation);
      this.util().addEvent(box, 'webkitAnimationEnd', this.resetAnimation);
      this.util().addEvent(box, 'MSAnimationEnd', this.resetAnimation);
      return box;
    };

    WOW.prototype.applyStyle = function(box, hidden) {
      var delay, duration, iteration;
      duration = box.getAttribute('data-wow-duration');
      delay = box.getAttribute('data-wow-delay');
      iteration = box.getAttribute('data-wow-iteration');
      return this.animate((function(_this) {
        return function() {
          return _this.customStyle(box, hidden, duration, delay, iteration);
        };
      })(this));
    };

    WOW.prototype.animate = (function() {
      if ('requestAnimationFrame' in window) {
        return function(callback) {
          return window.requestAnimationFrame(callback);
        };
      } else {
        return function(callback) {
          return callback();
        };
      }
    })();

    WOW.prototype.resetStyle = function() {
      var box, j, len, ref, results;
      ref = this.boxes;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        box = ref[j];
        results.push(box.style.visibility = 'visible');
      }
      return results;
    };

    WOW.prototype.resetAnimation = function(event) {
      var target;
      if (event.type.toLowerCase().indexOf('animationend') >= 0) {
        target = event.target || event.srcElement;
        return target.className = target.className.replace(this.config.animateClass, '').trim();
      }
    };

    WOW.prototype.customStyle = function(box, hidden, duration, delay, iteration) {
      if (hidden) {
        this.cacheAnimationName(box);
      }
      box.style.visibility = hidden ? 'hidden' : 'visible';
      if (duration) {
        this.vendorSet(box.style, {
          animationDuration: duration
        });
      }
      if (delay) {
        this.vendorSet(box.style, {
          animationDelay: delay
        });
      }
      if (iteration) {
        this.vendorSet(box.style, {
          animationIterationCount: iteration
        });
      }
      this.vendorSet(box.style, {
        animationName: hidden ? 'none' : this.cachedAnimationName(box)
      });
      return box;
    };

    WOW.prototype.vendors = ["moz", "webkit"];

    WOW.prototype.vendorSet = function(elem, properties) {
      var name, results, value, vendor;
      results = [];
      for (name in properties) {
        value = properties[name];
        elem["" + name] = value;
        results.push((function() {
          var j, len, ref, results1;
          ref = this.vendors;
          results1 = [];
          for (j = 0, len = ref.length; j < len; j++) {
            vendor = ref[j];
            results1.push(elem["" + vendor + (name.charAt(0).toUpperCase()) + (name.substr(1))] = value);
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    WOW.prototype.vendorCSS = function(elem, property) {
      var j, len, ref, result, style, vendor;
      style = getComputedStyle(elem);
      result = style.getPropertyCSSValue(property);
      ref = this.vendors;
      for (j = 0, len = ref.length; j < len; j++) {
        vendor = ref[j];
        result = result || style.getPropertyCSSValue("-" + vendor + "-" + property);
      }
      return result;
    };

    WOW.prototype.animationName = function(box) {
      var animationName, error;
      try {
        animationName = this.vendorCSS(box, 'animation-name').cssText;
      } catch (error) {
        animationName = getComputedStyle(box).getPropertyValue('animation-name');
      }
      if (animationName === 'none') {
        return '';
      } else {
        return animationName;
      }
    };

    WOW.prototype.cacheAnimationName = function(box) {
      return this.animationNameCache.set(box, this.animationName(box));
    };

    WOW.prototype.cachedAnimationName = function(box) {
      return this.animationNameCache.get(box);
    };

    WOW.prototype.scrollHandler = function() {
      return this.scrolled = true;
    };

    WOW.prototype.scrollCallback = function() {
      var box;
      if (this.scrolled) {
        this.scrolled = false;
        this.boxes = (function() {
          var j, len, ref, results;
          ref = this.boxes;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            box = ref[j];
            if (!(box)) {
              continue;
            }
            if (this.isVisible(box)) {
              this.show(box);
              continue;
            }
            results.push(box);
          }
          return results;
        }).call(this);
        if (!(this.boxes.length || this.config.live)) {
          return this.stop();
        }
      }
    };

    WOW.prototype.offsetTop = function(element) {
      var top;
      while (element.offsetTop === void 0) {
        element = element.parentNode;
      }
      top = element.offsetTop;
      while (element = element.offsetParent) {
        top += element.offsetTop;
      }
      return top;
    };

    WOW.prototype.isVisible = function(box) {
      var bottom, offset, top, viewBottom, viewTop;
      offset = box.getAttribute('data-wow-offset') || this.config.offset;
      viewTop = (this.config.scrollContainer && this.config.scrollContainer.scrollTop) || window.pageYOffset;
      viewBottom = viewTop + Math.min(this.element.clientHeight, this.util().innerHeight()) - offset;
      top = this.offsetTop(box);
      bottom = top + box.clientHeight;
      return top <= viewBottom && bottom >= viewTop;
    };

    WOW.prototype.util = function() {
      return this._util != null ? this._util : this._util = new Util();
    };

    WOW.prototype.disabled = function() {
      return !this.config.mobile && this.util().isMobile(navigator.userAgent);
    };

    return WOW;

  })();

}).call(this);

},{}],3:[function(require,module,exports){
"use strict";

var _wowjs = require("wowjs");
require("smoothscroll-for-websites");
// import "slick-carousel";
// import $ from "jquery";
var wow = new _wowjs.WOW({
  scrollContainer: '.content-main'
});
wow.init();
(function ($) {
  'use strict';

  // Preloader js    
  $(window).on('load', function () {
    $('.preloader').fadeOut(700);
  });

  // Sticky Menu
  // $(window).scroll(function () {
  // 	var height = $('.top-header').innerHeight();
  // 	if ($('header').offset().top > 10) {
  // 		$('.top-header').addClass('hide');
  // 		$('.navigation').addClass('nav-bg');
  // 		$('.navigation').css('margin-top', '-' + height + 'px');
  // 	} else {
  // 		$('.top-header').removeClass('hide');
  // 		$('.navigation').removeClass('nav-bg');
  // 		$('.navigation').css('margin-top', '-' + 0 + 'px');
  // 	}
  // });
  // navbarDropdown
  if ($(window).width() < 992) {
    $('.navigation .dropdown-toggle').on('click', function () {
      $(this).siblings('.dropdown-menu').animate({
        height: 'toggle'
      }, 300);
    });
  }

  // Background-images
  $('[data-background]').each(function () {
    $(this).css({
      'background-image': 'url(' + $(this).data('background') + ')'
    });
  });

  //Hero Slider
  // $('.hero-slider').slick({
  // 	autoplay: true,
  // 	autoplaySpeed: 7500,
  // 	pauseOnFocus: false,
  // 	pauseOnHover: false,
  // 	infinite: true,
  // 	arrows: true,
  // 	fade: true,
  // 	prevArrow: '<button type=\'button\' class=\'prevArrow\'><i class=\'ti-angle-left\'></i></button>',
  // 	nextArrow: '<button type=\'button\' class=\'nextArrow\'><i class=\'ti-angle-right\'></i></button>',
  // 	dots: true
  // });
  // $('.hero-slider').slickAnimation();

  // venobox popup
  $(document).ready(function () {
    $('.venobox').venobox();
  });

  // filter
  // $(document).ready(function () {
  // 	var containerEl = document.querySelector('.filtr-container');
  // 	var filterizd;
  // 	if (containerEl) {
  // 		filterizd = $('.filtr-container').filterizr({});
  // 	}
  // 	//Active changer
  // 	$('.filter-controls li').on('click', function () {
  // 		$('.filter-controls li').removeClass('active');
  // 		$(this).addClass('active');
  // 	});
  // });

  //  Count Up
  // function counter() {
  // 	var oTop;
  // 	if ($('.count').length !== 0) {
  // 		oTop = $('.count').offset().top - window.innerHeight;
  // 	}
  // 	if ($(window).scrollTop() > oTop) {
  // 		$('.count').each(function () {
  // 			var $this = $(this),
  // 			countTo = $this.attr('data-count');
  // 			$({
  // 				countNum: $this.text()
  // 			}).animate({
  // 				countNum: countTo
  // 			}, {
  // 				duration: 1000,
  // 				easing: 'swing',
  // 				step: function () {
  // 					$this.text(Math.floor(this.countNum));
  // 				},
  // 				complete: function () {
  // 					$this.text(this.countNum);
  // 				}
  // 			});
  // 		});
  // 	}
  // }
  // $(window).on('scroll', function () {
  // 	counter();
  // });
})(jQuery);

// var scrollToElement = require('scroll-to-element');
// const idDic ={
// 	"toHome" : "#home",
// 	"toAbout" : "#about",
// 	"toEvents":"#events",
// 	"toBestFac":"#best-fac",
// 	"toProjects":"#projects",
// 	"toContacts":"#contacts"
// }
// $(document).ready(function(){
//     $(".scroll-ani").click(function(){
// 		scrollToElement(idDic[$(this).attr("id")],{offset: -100});

//     });
// });
// var SmoothScroll=require('smooth-scroll')
// var scroll = new SmoothScroll('a[href*="#"]',{offset:100,speed:10});

// var anime=require('animejs');
// var litm=document.querySelectorAll("#events-list li");
// var animation = anime({
// 	targets: litm,
// 	keyframes : [
// 		{opacity: 0,translateX : -10,duration:0},
// 		{opacity: 100,translateX : 10}
// 	],
// 	delay: anime.stagger(100, {start: 0}),
// 	autoplay:false,
//   });
// $(window).scroll(function() {
// 	var hT = $('#events-list').offset().top,
//        hH = $('#events-list').outerHeight(),
//        wH = $(window).height(),
//        wS = $(this).scrollTop();
//    if (wS > (hT+hH-wH) && (hT > wS) && (wS+wH > hT+hH)){
//        animation.restart();
//    }
//  });
jQuery(function () {
  $.get("data/facultyaward.csv", function (data) {
    var content = $(".awardtime")[0].innerHTML;
    var to = $(".awardtime");
    to[0].innerHTML = "";
    data.split("\n").forEach(function (row) {
      var ele = $(content);
      var arr = row.split(",");
      ele.children("div").children(".content").children("p").text(arr[0]);
      ele.children("div").children(".content-hover").children("p").text(arr[1]);
      ele.children("div").children(".content-hover").children("h1").text(arr[0]);
      to.append(ele);
    });
    // wow.sync();
    var sli = $(".awardtime").slick({
      slidesToShow: 3,
      centerMode: true,
      //   centerPadding: '360px',
      slidesToScroll: 1,
      autoplay: true,
      pauseOnFocus: false,
      autoplaySpeed: 2000,
      // fade:true,
      // swipeToSlide:true,
      arrows: false,
      cssEase: 'linear',
      // infinite:false,
      responsive: [{
        breakpoint: 600,
        settings: {
          slidesToShow: 1
        }
      }]
    });
    sli.on('beforeChange', function (event, slick, currentSlideIndex, nextSlideIndex) {
      // 	if(nextSlideIndex > currentSlideIndex) {
      // 		// Animation to go to next slide
      // 		nextSlideIndex+=1;
      // 	   $('.awardtime .slick-slide[data-slick-index=' + (currentSlideIndex-1) + ']').addClass('bounceOutDown').removeClass('bounceInDown');
      // 	   $('.awardtime .slick-slide[data-slick-index=' + nextSlideIndex + ']').addClass('bounceInDown').removeClass('bounceOutDown');
      //    } else {
      //    }
    });
  });
  $.get("data/eventslist.csv", function (data) {
    var content = "";
    data.split("\n").forEach(function (row) {
      content += "<li class='wow fadeInLeft'>";
      content += "<p>" + row.split('`')[0] + "</p>";
      content += "</li>";
    });
    $("#events-list")[0].innerHTML = content;
    wow.sync();
  });
  $(".projectsslide").slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    // centerMode:true,
    dots: false,
    arrows: true,
    nextArrow: $('.nxtproj'),
    prevArrow: $('.prevproj'),
    responsive: [{
      breakpoint: 600,
      settings: {
        slidesToShow: 1
      }
    }]
  });
});

// var lastScrollTop = $(this).scrollTop();

// 	$(window).scroll(function(){
// 		var st = $(this).scrollTop();

// 		if (st > lastScrollTop){
// 			$('html, body').animate({
// 				scrollTop: st+10,
// 			},80);
// 		} else {
// 			$('html, body').animate({
// 				scrollTop: st-10,
// 			},80);
// 		}
// 		lastScrollTop = st;
// 	});

},{"smoothscroll-for-websites":1,"wowjs":2}],4:[function(require,module,exports){
"use strict";

// //
// // SmoothScroll for websites v1.2.1
// // Licensed under the terms of the MIT license.
// //
// // You may use it in your theme if you credit me. 
// // It is also free to use on any individual website.
// //
// // Exception:
// // The only restriction would be not to publish any  
// // extension for browsers or native application
// // without getting a permission first.
// //

// // People involved
// //  - Balazs Galambosi (maintainer)   
// //  - Michael Herf     (Pulse Algorithm)

// (function(){

//     // Scroll Variables (tweakable)
//     var defaultOptions = {

//         // Scrolling Core
//         frameRate        : 150, // [Hz]
//         animationTime    : 400, // [px]
//         stepSize         : 120, // [px]

//         // Pulse (less tweakable)
//         // ratio of "tail" to "acceleration"
//         pulseAlgorithm   : true,
//         pulseScale       : 8,
//         pulseNormalize   : 1,

//         // Acceleration
//         accelerationDelta : 20,  // 20
//         accelerationMax   : 1,   // 1

//         // Keyboard Settings
//         keyboardSupport   : true,  // option
//         arrowScroll       : 50,     // [px]

//         // Other
//         touchpadSupport   : true,
//         fixedBackground   : true, 
//         excluded          : ""    
//     };

//     var options = defaultOptions;

//     // Other Variables
//     var isExcluded = false;
//     var isFrame = false;
//     var direction = { x: 0, y: 0 };
//     var initDone  = false;
//     var root = document.documentElement;
//     var activeElement;
//     var observer;
//     var deltaBuffer = [ 120, 120, 120 ];

//     var key = { left: 37, up: 38, right: 39, down: 40, spacebar: 32, 
//                 pageup: 33, pagedown: 34, end: 35, home: 36 };

//     /***********************************************
//      * SETTINGS
//      ***********************************************/

//     var options = defaultOptions;

//     /***********************************************
//      * INITIALIZE
//      ***********************************************/

//     /**
//      * Tests if smooth scrolling is allowed. Shuts down everything if not.
//      */
//     function initTest() {

//         var disableKeyboard = false; 

//         // disable keyboard support if anything above requested it
//         if (disableKeyboard) {
//             removeEvent("keydown", keydown);
//         }

//         if (options.keyboardSupport && !disableKeyboard) {
//             addEvent("keydown", keydown);
//         }
//     }

//     /**
//      * Sets up scrolls array, determines if frames are involved.
//      */
//     function init() {

//         if (!document.body) return;

//         var body = document.body;
//         var html = document.documentElement;
//         var windowHeight = window.innerHeight; 
//         var scrollHeight = body.scrollHeight;

//         // check compat mode for root element
//         root = (document.compatMode.indexOf('CSS') >= 0) ? html : body;
//         activeElement = body;

//         initTest();
//         initDone = true;

//         // Checks if this script is running in a frame
//         if (top != self) {
//             isFrame = true;
//         }

//         /**
//          * This fixes a bug where the areas left and right to 
//          * the content does not trigger the onmousewheel event
//          * on some pages. e.g.: html, body { height: 100% }
//          */
//         else if (scrollHeight > windowHeight &&
//                 (body.offsetHeight <= windowHeight || 
//                  html.offsetHeight <= windowHeight)) {

//             // DOMChange (throttle): fix height
//             var pending = false;
//             var refresh = function () {
//                 if (!pending && html.scrollHeight != document.height) {
//                     pending = true; // add a new pending action
//                     setTimeout(function () {
//                         html.style.height = document.height + 'px';
//                         pending = false;
//                     }, 500); // act rarely to stay fast
//                 }
//             };
//             html.style.height = 'auto';
//             setTimeout(refresh, 10);

//             // clearfix
//             if (root.offsetHeight <= windowHeight) {
//                 var underlay = document.createElement("div");   
//                 underlay.style.clear = "both";
//                 body.appendChild(underlay);
//             }
//         }

//         // disable fixed background
//         if (!options.fixedBackground && !isExcluded) {
//             body.style.backgroundAttachment = "scroll";
//             html.style.backgroundAttachment = "scroll";
//         }
//     }

//     /************************************************
//      * SCROLLING 
//      ************************************************/

//     var que = [];
//     var pending = false;
//     var lastScroll = +new Date;

//     /**
//      * Pushes scroll actions to the scrolling queue.
//      */
//     function scrollArray(elem, left, top, delay) {

//         delay || (delay = 1000);
//         directionCheck(left, top);

//         if (options.accelerationMax != 1) {
//             var now = +new Date;
//             var elapsed = now - lastScroll;
//             if (elapsed < options.accelerationDelta) {
//                 var factor = (1 + (30 / elapsed)) / 2;
//                 if (factor > 1) {
//                     factor = Math.min(factor, options.accelerationMax);
//                     left *= factor;
//                     top  *= factor;
//                 }
//             }
//             lastScroll = +new Date;
//         }          

//         // push a scroll command
//         que.push({
//             x: left, 
//             y: top, 
//             lastX: (left < 0) ? 0.99 : -0.99,
//             lastY: (top  < 0) ? 0.99 : -0.99, 
//             start: +new Date
//         });

//         // don't act if there's a pending queue
//         if (pending) {
//             return;
//         }  

//         var scrollWindow = (elem === document.body);

//         var step = function (time) {

//             var now = +new Date;
//             var scrollX = 0;
//             var scrollY = 0; 

//             for (var i = 0; i < que.length; i++) {

//                 var item = que[i];
//                 var elapsed  = now - item.start;
//                 var finished = (elapsed >= options.animationTime);

//                 // scroll position: [0, 1]
//                 var position = (finished) ? 1 : elapsed / options.animationTime;

//                 // easing [optional]
//                 if (options.pulseAlgorithm) {
//                     position = pulse(position);
//                 }

//                 // only need the difference
//                 var x = (item.x * position - item.lastX) >> 0;
//                 var y = (item.y * position - item.lastY) >> 0;

//                 // add this to the total scrolling
//                 scrollX += x;
//                 scrollY += y;            

//                 // update last values
//                 item.lastX += x;
//                 item.lastY += y;

//                 // delete and step back if it's over
//                 if (finished) {
//                     que.splice(i, 1); i--;
//                 }           
//             }

//             // scroll left and top
//             if (scrollWindow) {
//                 window.scrollBy(scrollX, scrollY);
//             } 
//             else {
//                 if (scrollX) elem.scrollLeft += scrollX;
//                 if (scrollY) elem.scrollTop  += scrollY;                    
//             }

//             // clean up if there's nothing left to do
//             if (!left && !top) {
//                 que = [];
//             }

//             if (que.length) { 
//                 requestFrame(step, elem, (delay / options.frameRate + 1)); 
//             } else { 
//                 pending = false;
//             }
//         };

//         // start a new queue of actions
//         requestFrame(step, elem, 0);
//         pending = true;
//     }

//     /***********************************************
//      * EVENTS
//      ***********************************************/

//     /**
//      * Mouse wheel handler.
//      * @param {Object} event
//      */
//     function wheel(event) {

//         if (!initDone) {
//             init();
//         }

//         var target = event.target;
//         var overflowing = overflowingAncestor(target);

//         // use default if there's no overflowing
//         // element or default action is prevented    
//         if (!overflowing || event.defaultPrevented ||
//             isNodeName(activeElement, "embed") ||
//            (isNodeName(target, "embed") && /\.pdf/i.test(target.src))) {
//             return true;
//         }

//         var deltaX = event.wheelDeltaX || 0;
//         var deltaY = event.wheelDeltaY || 0;

//         // use wheelDelta if deltaX/Y is not available
//         if (!deltaX && !deltaY) {
//             deltaY = event.wheelDelta || 0;
//         }

//         // check if it's a touchpad scroll that should be ignored
//         if (!options.touchpadSupport && isTouchpad(deltaY)) {
//             return true;
//         }

//         // scale by step size
//         // delta is 120 most of the time
//         // synaptics seems to send 1 sometimes
//         if (Math.abs(deltaX) > 1.2) {
//             deltaX *= options.stepSize / 120;
//         }
//         if (Math.abs(deltaY) > 1.2) {
//             deltaY *= options.stepSize / 120;
//         }

//         scrollArray(overflowing, -deltaX, -deltaY);
//         event.preventDefault();
//     }

//     /**
//      * Keydown event handler.
//      * @param {Object} event
//      */
//     function keydown(event) {

//         var target   = event.target;
//         var modifier = event.ctrlKey || event.altKey || event.metaKey || 
//                       (event.shiftKey && event.keyCode !== key.spacebar);

//         // do nothing if user is editing text
//         // or using a modifier key (except shift)
//         // or in a dropdown
//         if ( /input|textarea|select|embed/i.test(target.nodeName) ||
//              target.isContentEditable || 
//              event.defaultPrevented   ||
//              modifier ) {
//           return true;
//         }
//         // spacebar should trigger button press
//         if (isNodeName(target, "button") &&
//             event.keyCode === key.spacebar) {
//           return true;
//         }

//         var shift, x = 0, y = 0;
//         var elem = overflowingAncestor(activeElement);
//         var clientHeight = elem.clientHeight;

//         if (elem == document.body) {
//             clientHeight = window.innerHeight;
//         }

//         switch (event.keyCode) {
//             case key.up:
//                 y = -options.arrowScroll;
//                 break;
//             case key.down:
//                 y = options.arrowScroll;
//                 break;         
//             case key.spacebar: // (+ shift)
//                 shift = event.shiftKey ? 1 : -1;
//                 y = -shift * clientHeight * 0.9;
//                 break;
//             case key.pageup:
//                 y = -clientHeight * 0.9;
//                 break;
//             case key.pagedown:
//                 y = clientHeight * 0.9;
//                 break;
//             case key.home:
//                 y = -elem.scrollTop;
//                 break;
//             case key.end:
//                 var damt = elem.scrollHeight - elem.scrollTop - clientHeight;
//                 y = (damt > 0) ? damt+10 : 0;
//                 break;
//             case key.left:
//                 x = -options.arrowScroll;
//                 break;
//             case key.right:
//                 x = options.arrowScroll;
//                 break;            
//             default:
//                 return true; // a key we don't care about
//         }

//         scrollArray(elem, x, y);
//         event.preventDefault();
//     }

//     /**
//      * Mousedown event only for updating activeElement
//      */
//     function mousedown(event) {
//         activeElement = event.target;
//     }

//     /***********************************************
//      * OVERFLOW
//      ***********************************************/

//     var cache = {}; // cleared out every once in while
//     setInterval(function () { cache = {}; }, 10 * 1000);

//     var uniqueID = (function () {
//         var i = 0;
//         return function (el) {
//             return el.uniqueID || (el.uniqueID = i++);
//         };
//     })();

//     function setCache(elems, overflowing) {
//         for (var i = elems.length; i--;)
//             cache[uniqueID(elems[i])] = overflowing;
//         return overflowing;
//     }

//     function overflowingAncestor(el) {
//         var elems = [];
//         var rootScrollHeight = root.scrollHeight;
//         do {
//             var cached = cache[uniqueID(el)];
//             if (cached) {
//                 return setCache(elems, cached);
//             }
//             elems.push(el);
//             if (rootScrollHeight === el.scrollHeight) {
//                 if (!isFrame || root.clientHeight + 10 < rootScrollHeight) {
//                     return setCache(elems, document.body); // scrolling root in WebKit
//                 }
//             } else if (el.clientHeight + 10 < el.scrollHeight) {
//                 overflow = getComputedStyle(el, "").getPropertyValue("overflow-y");
//                 if (overflow === "scroll" || overflow === "auto") {
//                     return setCache(elems, el);
//                 }
//             }
//         } while (el = el.parentNode);
//     }

//     /***********************************************
//      * HELPERS
//      ***********************************************/

//     function addEvent(type, fn, bubble) {
//         window.addEventListener(type, fn, (bubble||false));
//     }

//     function removeEvent(type, fn, bubble) {
//         window.removeEventListener(type, fn, (bubble||false));  
//     }

//     function isNodeName(el, tag) {
//         return (el.nodeName||"").toLowerCase() === tag.toLowerCase();
//     }

//     function directionCheck(x, y) {
//         x = (x > 0) ? 1 : -1;
//         y = (y > 0) ? 1 : -1;
//         if (direction.x !== x || direction.y !== y) {
//             direction.x = x;
//             direction.y = y;
//             que = [];
//             lastScroll = 0;
//         }
//     }

//     var deltaBufferTimer;

//     function isTouchpad(deltaY) {
//         if (!deltaY) return;
//         deltaY = Math.abs(deltaY)
//         deltaBuffer.push(deltaY);
//         deltaBuffer.shift();
//         clearTimeout(deltaBufferTimer);
//         var allDivisable = (isDivisible(deltaBuffer[0], 120) &&
//                             isDivisible(deltaBuffer[1], 120) &&
//                             isDivisible(deltaBuffer[2], 120));
//         return !allDivisable;
//     } 

//     function isDivisible(n, divisor) {
//         return (Math.floor(n / divisor) == n / divisor);
//     }

//     var requestFrame = (function () {
//           return  window.requestAnimationFrame       || 
//                   window.webkitRequestAnimationFrame || 
//                   function (callback, element, delay) {
//                       window.setTimeout(callback, delay || (1000/60));
//                   };
//     })();

//     /***********************************************
//      * PULSE
//      ***********************************************/

//     /**
//      * Viscous fluid with a pulse for part and decay for the rest.
//      * - Applies a fixed force over an interval (a damped acceleration), and
//      * - Lets the exponential bleed away the velocity over a longer interval
//      * - Michael Herf, http://stereopsis.com/stopping/
//      */
//     function pulse_(x) {
//         var val, start, expx;
//         // test
//         x = x * options.pulseScale;
//         if (x < 1) { // acceleartion
//             val = x - (1 - Math.exp(-x));
//         } else {     // tail
//             // the previous animation ended here:
//             start = Math.exp(-1);
//             // simple viscous drag
//             x -= 1;
//             expx = 1 - Math.exp(-x);
//             val = start + (expx * (1 - start));
//         }
//         return val * options.pulseNormalize;
//     }

//     function pulse(x) {
//         if (x >= 1) return 1;
//         if (x <= 0) return 0;

//         if (options.pulseNormalize == 1) {
//             options.pulseNormalize /= pulse_(1);
//         }
//         return pulse_(x);
//     }

//     var isChrome = /chrome/i.test(window.navigator.userAgent);
//     var wheelEvent = null;
//     if ("onwheel" in document.createElement("div"))
//         wheelEvent = "wheel";
//     else if ("onmousewheel" in document.createElement("div"))
//         wheelEvent = "mousewheel";

//     if (wheelEvent && isChrome) {
//         addEvent(wheelEvent, wheel);
//         addEvent("mousedown", mousedown);
//         addEvent("load", init);
//     }

//     })();

// Cache selectors
var topMenu = $(".navigation"),
  topMenuHeight = topMenu.outerHeight() + 15,
  // All list items
  menuItems = topMenu.find("a"),
  // Anchors corresponding to menu items
  scrollItems = menuItems.map(function () {
    var item = $($(this).attr("href"));
    if (item.length) {
      return item;
    }
  }),
  h = $('.content-main').height() / 2;

// Bind to scroll
$('.content-main').scroll(function () {
  // Get container scroll position
  var fromTop = $(this).offset().top + h;
  //    console.log(fromTop);

  // Get id of current scroll item
  var cur = scrollItems.map(function () {
    if ($(this).offset().top < fromTop) return this;
  });
  // Get the id of the current element
  cur = cur[cur.length - 1];
  var id = cur && cur.length ? cur[0].id : "";
  // Set/remove active class
  menuItems.parent().removeClass("active").end().filter("[href='#" + id + "']").parent().addClass("active");
});

},{}]},{},[3,4]);
