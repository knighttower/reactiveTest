(()=>{"use strict";var e={d:(t,n)=>{for(var o in n)e.o(n,o)&&!e.o(t,o)&&Object.defineProperty(t,o,{enumerable:!0,get:n[o]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},t={};e.r(t),e.d(t,{typesMap:()=>r});const n={};function o(e,t){if(null===e)return t?null===t||"null"===t:"null";let n;switch(typeof e){case"number":case"string":case"boolean":case"undefined":case"bigint":case"symbol":case"function":n=typeof e;break;case"object":n=Array.isArray(e)?"array":"object";break;default:n="unknown"}if(t){if(t.includes("|")){for(let e of t.split("|"))if(n===e)return e;return!1}return t===n}return n}(()=>{if("undefined"!=typeof window){const e={childList:!0,subtree:!0};new MutationObserver((e=>{for(const t of e)if("childList"===t.type)for(const e in n)n[e]()})).observe(document.body,e)}})();const r=new Map([["array",e=>o(e,"array")],["bigInt",e=>"bigint"==typeof e],["boolean",e=>"boolean"==typeof e],["date",e=>e instanceof Date],["float",e=>"number"==typeof e&&!Number.isInteger(e)],["function",e=>"function"==typeof e],["int",e=>Number.isInteger(e)],["map",e=>e instanceof Map],["null",e=>null===e],["number",e=>"number"==typeof e],["object",e=>o(e,"object")],["promise",e=>e instanceof Promise],["regExp",e=>e instanceof RegExp],["set",e=>e instanceof Set],["string",e=>"string"==typeof e],["symbol",e=>"symbol"==typeof e],["undefined",e=>void 0===e],["weakMap",e=>e instanceof WeakMap],["weakSet",e=>e instanceof WeakSet]]);window.types=t})();