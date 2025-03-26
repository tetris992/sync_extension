/*! For license information please see coolStay.bundle.js.LICENSE.txt */
(()=>{var t={353:function(t){t.exports=function(){"use strict";var t=6e4,e=36e5,r="millisecond",n="second",o="minute",i="hour",a="day",s="week",c="month",u="quarter",f="year",h="date",l="Invalid Date",d=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,p=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,v={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),ordinal:function(t){var e=["th","st","nd","rd"],r=t%100;return"["+t+(e[(r-20)%10]||e[r]||e[0])+"]"}},y=function(t,e,r){var n=String(t);return!n||n.length>=e?t:""+Array(e+1-n.length).join(r)+t},m={s:y,z:function(t){var e=-t.utcOffset(),r=Math.abs(e),n=Math.floor(r/60),o=r%60;return(e<=0?"+":"-")+y(n,2,"0")+":"+y(o,2,"0")},m:function t(e,r){if(e.date()<r.date())return-t(r,e);var n=12*(r.year()-e.year())+(r.month()-e.month()),o=e.clone().add(n,c),i=r-o<0,a=e.clone().add(n+(i?-1:1),c);return+(-(n+(r-o)/(i?o-a:a-o))||0)},a:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},p:function(t){return{M:c,y:f,w:s,d:a,D:h,h:i,m:o,s:n,ms:r,Q:u}[t]||String(t||"").toLowerCase().replace(/s$/,"")},u:function(t){return void 0===t}},g="en",w={};w[g]=v;var b="$isDayjsObject",M=function(t){return t instanceof $||!(!t||!t[b])},D=function t(e,r,n){var o;if(!e)return g;if("string"==typeof e){var i=e.toLowerCase();w[i]&&(o=i),r&&(w[i]=r,o=i);var a=e.split("-");if(!o&&a.length>1)return t(a[0])}else{var s=e.name;w[s]=e,o=s}return!n&&o&&(g=o),o||!n&&g},S=function(t,e){if(M(t))return t.clone();var r="object"==typeof e?e:{};return r.date=t,r.args=arguments,new $(r)},x=m;x.l=D,x.i=M,x.w=function(t,e){return S(t,{locale:e.$L,utc:e.$u,x:e.$x,$offset:e.$offset})};var $=function(){function v(t){this.$L=D(t.locale,null,!0),this.parse(t),this.$x=this.$x||t.x||{},this[b]=!0}var y=v.prototype;return y.parse=function(t){this.$d=function(t){var e=t.date,r=t.utc;if(null===e)return new Date(NaN);if(x.u(e))return new Date;if(e instanceof Date)return new Date(e);if("string"==typeof e&&!/Z$/i.test(e)){var n=e.match(d);if(n){var o=n[2]-1||0,i=(n[7]||"0").substring(0,3);return r?new Date(Date.UTC(n[1],o,n[3]||1,n[4]||0,n[5]||0,n[6]||0,i)):new Date(n[1],o,n[3]||1,n[4]||0,n[5]||0,n[6]||0,i)}}return new Date(e)}(t),this.init()},y.init=function(){var t=this.$d;this.$y=t.getFullYear(),this.$M=t.getMonth(),this.$D=t.getDate(),this.$W=t.getDay(),this.$H=t.getHours(),this.$m=t.getMinutes(),this.$s=t.getSeconds(),this.$ms=t.getMilliseconds()},y.$utils=function(){return x},y.isValid=function(){return!(this.$d.toString()===l)},y.isSame=function(t,e){var r=S(t);return this.startOf(e)<=r&&r<=this.endOf(e)},y.isAfter=function(t,e){return S(t)<this.startOf(e)},y.isBefore=function(t,e){return this.endOf(e)<S(t)},y.$g=function(t,e,r){return x.u(t)?this[e]:this.set(r,t)},y.unix=function(){return Math.floor(this.valueOf()/1e3)},y.valueOf=function(){return this.$d.getTime()},y.startOf=function(t,e){var r=this,u=!!x.u(e)||e,l=x.p(t),d=function(t,e){var n=x.w(r.$u?Date.UTC(r.$y,e,t):new Date(r.$y,e,t),r);return u?n:n.endOf(a)},p=function(t,e){return x.w(r.toDate()[t].apply(r.toDate("s"),(u?[0,0,0,0]:[23,59,59,999]).slice(e)),r)},v=this.$W,y=this.$M,m=this.$D,g="set"+(this.$u?"UTC":"");switch(l){case f:return u?d(1,0):d(31,11);case c:return u?d(1,y):d(0,y+1);case s:var w=this.$locale().weekStart||0,b=(v<w?v+7:v)-w;return d(u?m-b:m+(6-b),y);case a:case h:return p(g+"Hours",0);case i:return p(g+"Minutes",1);case o:return p(g+"Seconds",2);case n:return p(g+"Milliseconds",3);default:return this.clone()}},y.endOf=function(t){return this.startOf(t,!1)},y.$set=function(t,e){var s,u=x.p(t),l="set"+(this.$u?"UTC":""),d=(s={},s[a]=l+"Date",s[h]=l+"Date",s[c]=l+"Month",s[f]=l+"FullYear",s[i]=l+"Hours",s[o]=l+"Minutes",s[n]=l+"Seconds",s[r]=l+"Milliseconds",s)[u],p=u===a?this.$D+(e-this.$W):e;if(u===c||u===f){var v=this.clone().set(h,1);v.$d[d](p),v.init(),this.$d=v.set(h,Math.min(this.$D,v.daysInMonth())).$d}else d&&this.$d[d](p);return this.init(),this},y.set=function(t,e){return this.clone().$set(t,e)},y.get=function(t){return this[x.p(t)]()},y.add=function(r,u){var h,l=this;r=Number(r);var d=x.p(u),p=function(t){var e=S(l);return x.w(e.date(e.date()+Math.round(t*r)),l)};if(d===c)return this.set(c,this.$M+r);if(d===f)return this.set(f,this.$y+r);if(d===a)return p(1);if(d===s)return p(7);var v=(h={},h[o]=t,h[i]=e,h[n]=1e3,h)[d]||1,y=this.$d.getTime()+r*v;return x.w(y,this)},y.subtract=function(t,e){return this.add(-1*t,e)},y.format=function(t){var e=this,r=this.$locale();if(!this.isValid())return r.invalidDate||l;var n=t||"YYYY-MM-DDTHH:mm:ssZ",o=x.z(this),i=this.$H,a=this.$m,s=this.$M,c=r.weekdays,u=r.months,f=r.meridiem,h=function(t,r,o,i){return t&&(t[r]||t(e,n))||o[r].slice(0,i)},d=function(t){return x.s(i%12||12,t,"0")},v=f||function(t,e,r){var n=t<12?"AM":"PM";return r?n.toLowerCase():n};return n.replace(p,(function(t,n){return n||function(t){switch(t){case"YY":return String(e.$y).slice(-2);case"YYYY":return x.s(e.$y,4,"0");case"M":return s+1;case"MM":return x.s(s+1,2,"0");case"MMM":return h(r.monthsShort,s,u,3);case"MMMM":return h(u,s);case"D":return e.$D;case"DD":return x.s(e.$D,2,"0");case"d":return String(e.$W);case"dd":return h(r.weekdaysMin,e.$W,c,2);case"ddd":return h(r.weekdaysShort,e.$W,c,3);case"dddd":return c[e.$W];case"H":return String(i);case"HH":return x.s(i,2,"0");case"h":return d(1);case"hh":return d(2);case"a":return v(i,a,!0);case"A":return v(i,a,!1);case"m":return String(a);case"mm":return x.s(a,2,"0");case"s":return String(e.$s);case"ss":return x.s(e.$s,2,"0");case"SSS":return x.s(e.$ms,3,"0");case"Z":return o}return null}(t)||o.replace(":","")}))},y.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},y.diff=function(r,h,l){var d,p=this,v=x.p(h),y=S(r),m=(y.utcOffset()-this.utcOffset())*t,g=this-y,w=function(){return x.m(p,y)};switch(v){case f:d=w()/12;break;case c:d=w();break;case u:d=w()/3;break;case s:d=(g-m)/6048e5;break;case a:d=(g-m)/864e5;break;case i:d=g/e;break;case o:d=g/t;break;case n:d=g/1e3;break;default:d=g}return l?d:x.a(d)},y.daysInMonth=function(){return this.endOf(c).$D},y.$locale=function(){return w[this.$L]},y.locale=function(t,e){if(!t)return this.$L;var r=this.clone(),n=D(t,e,!0);return n&&(r.$L=n),r},y.clone=function(){return x.w(this.$d,this)},y.toDate=function(){return new Date(this.valueOf())},y.toJSON=function(){return this.isValid()?this.toISOString():null},y.toISOString=function(){return this.$d.toISOString()},y.toString=function(){return this.$d.toUTCString()},v}(),L=$.prototype;return S.prototype=L,[["$ms",r],["$s",n],["$m",o],["$H",i],["$W",a],["$M",c],["$y",f],["$D",h]].forEach((function(t){L[t[1]]=function(e){return this.$g(e,t[0],t[1])}})),S.extend=function(t,e){return t.$i||(t(e,$,S),t.$i=!0),S},S.locale=D,S.isDayjs=M,S.unix=function(t){return S(1e3*t)},S.en=w[g],S.Ls=w,S.p={},S}()},445:function(t){t.exports=function(){"use strict";var t={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},e=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,r=/\d/,n=/\d\d/,o=/\d\d?/,i=/\d*[^-_:/,()\s\d]+/,a={},s=function(t){return(t=+t)+(t>68?1900:2e3)},c=function(t){return function(e){this[t]=+e}},u=[/[+-]\d\d:?(\d\d)?|Z/,function(t){(this.zone||(this.zone={})).offset=function(t){if(!t)return 0;if("Z"===t)return 0;var e=t.match(/([+-]|\d\d)/g),r=60*e[1]+(+e[2]||0);return 0===r?0:"+"===e[0]?-r:r}(t)}],f=function(t){var e=a[t];return e&&(e.indexOf?e:e.s.concat(e.f))},h=function(t,e){var r,n=a.meridiem;if(n){for(var o=1;o<=24;o+=1)if(t.indexOf(n(o,0,e))>-1){r=o>12;break}}else r=t===(e?"pm":"PM");return r},l={A:[i,function(t){this.afternoon=h(t,!1)}],a:[i,function(t){this.afternoon=h(t,!0)}],Q:[r,function(t){this.month=3*(t-1)+1}],S:[r,function(t){this.milliseconds=100*+t}],SS:[n,function(t){this.milliseconds=10*+t}],SSS:[/\d{3}/,function(t){this.milliseconds=+t}],s:[o,c("seconds")],ss:[o,c("seconds")],m:[o,c("minutes")],mm:[o,c("minutes")],H:[o,c("hours")],h:[o,c("hours")],HH:[o,c("hours")],hh:[o,c("hours")],D:[o,c("day")],DD:[n,c("day")],Do:[i,function(t){var e=a.ordinal,r=t.match(/\d+/);if(this.day=r[0],e)for(var n=1;n<=31;n+=1)e(n).replace(/\[|\]/g,"")===t&&(this.day=n)}],w:[o,c("week")],ww:[n,c("week")],M:[o,c("month")],MM:[n,c("month")],MMM:[i,function(t){var e=f("months"),r=(f("monthsShort")||e.map((function(t){return t.slice(0,3)}))).indexOf(t)+1;if(r<1)throw new Error;this.month=r%12||r}],MMMM:[i,function(t){var e=f("months").indexOf(t)+1;if(e<1)throw new Error;this.month=e%12||e}],Y:[/[+-]?\d+/,c("year")],YY:[n,function(t){this.year=s(t)}],YYYY:[/\d{4}/,c("year")],Z:u,ZZ:u};function d(r){var n,o;n=r,o=a&&a.formats;for(var i=(r=n.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,(function(e,r,n){var i=n&&n.toUpperCase();return r||o[n]||t[n]||o[i].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,(function(t,e,r){return e||r.slice(1)}))}))).match(e),s=i.length,c=0;c<s;c+=1){var u=i[c],f=l[u],h=f&&f[0],d=f&&f[1];i[c]=d?{regex:h,parser:d}:u.replace(/^\[|\]$/g,"")}return function(t){for(var e={},r=0,n=0;r<s;r+=1){var o=i[r];if("string"==typeof o)n+=o.length;else{var a=o.regex,c=o.parser,u=t.slice(n),f=a.exec(u)[0];c.call(e,f),t=t.replace(f,"")}}return function(t){var e=t.afternoon;if(void 0!==e){var r=t.hours;e?r<12&&(t.hours+=12):12===r&&(t.hours=0),delete t.afternoon}}(e),e}}return function(t,e,r){r.p.customParseFormat=!0,t&&t.parseTwoDigitYear&&(s=t.parseTwoDigitYear);var n=e.prototype,o=n.parse;n.parse=function(t){var e=t.date,n=t.utc,i=t.args;this.$u=n;var s=i[1];if("string"==typeof s){var c=!0===i[2],u=!0===i[3],f=c||u,h=i[2];u&&(h=i[2]),a=this.$locale(),!c&&h&&(a=r.Ls[h]),this.$d=function(t,e,r,n){try{if(["x","X"].indexOf(e)>-1)return new Date(("X"===e?1e3:1)*t);var o=d(e)(t),i=o.year,a=o.month,s=o.day,c=o.hours,u=o.minutes,f=o.seconds,h=o.milliseconds,l=o.zone,p=o.week,v=new Date,y=s||(i||a?1:v.getDate()),m=i||v.getFullYear(),g=0;i&&!a||(g=a>0?a-1:v.getMonth());var w,b=c||0,M=u||0,D=f||0,S=h||0;return l?new Date(Date.UTC(m,g,y,b,M,D,S+60*l.offset*1e3)):r?new Date(Date.UTC(m,g,y,b,M,D,S)):(w=new Date(m,g,y,b,M,D,S),p&&(w=n(w).week(p).toDate()),w)}catch(t){return new Date("")}}(e,s,n,r),this.init(),h&&!0!==h&&(this.$L=this.locale(h).$L),f&&e!=this.format(s)&&(this.$d=new Date("")),a={}}else if(s instanceof Array)for(var l=s.length,p=1;p<=l;p+=1){i[1]=s[p-1];var v=r.apply(this,i);if(v.isValid()){this.$d=v.$d,this.$L=v.$L,this.init();break}p===l&&(this.$d=new Date(""))}else o.call(this,t)}}}()},872:function(t){t.exports=function(){"use strict";return function(t,e,r){e.prototype.isBetween=function(t,e,n,o){var i=r(t),a=r(e),s="("===(o=o||"()")[0],c=")"===o[1];return(s?this.isAfter(i,n):!this.isBefore(i,n))&&(c?this.isBefore(a,n):!this.isAfter(a,n))||(s?this.isBefore(i,n):!this.isAfter(i,n))&&(c?this.isAfter(a,n):!this.isBefore(a,n))}}}()}},e={};function r(n){var o=e[n];if(void 0!==o)return o.exports;var i=e[n]={exports:{}};return t[n].call(i.exports,i,i.exports,r),i.exports}r.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return r.d(e,{a:e}),e},r.d=(t,e)=>{for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},r.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),(()=>{"use strict";var t=r(353),e=r.n(t),n=r(445),o=r.n(n),i=r(872),a=r.n(i),s="https://staysync.org";function c(t){return c="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},c(t)}function u(){u=function(){return e};var t,e={},r=Object.prototype,n=r.hasOwnProperty,o=Object.defineProperty||function(t,e,r){t[e]=r.value},i="function"==typeof Symbol?Symbol:{},a=i.iterator||"@@iterator",s=i.asyncIterator||"@@asyncIterator",f=i.toStringTag||"@@toStringTag";function h(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{h({},"")}catch(t){h=function(t,e,r){return t[e]=r}}function l(t,e,r,n){var i=e&&e.prototype instanceof w?e:w,a=Object.create(i.prototype),s=new j(n||[]);return o(a,"_invoke",{value:Y(t,r,s)}),a}function d(t,e,r){try{return{type:"normal",arg:t.call(e,r)}}catch(t){return{type:"throw",arg:t}}}e.wrap=l;var p="suspendedStart",v="suspendedYield",y="executing",m="completed",g={};function w(){}function b(){}function M(){}var D={};h(D,a,(function(){return this}));var S=Object.getPrototypeOf,x=S&&S(S(T([])));x&&x!==r&&n.call(x,a)&&(D=x);var $=M.prototype=w.prototype=Object.create(D);function L(t){["next","throw","return"].forEach((function(e){h(t,e,(function(t){return this._invoke(e,t)}))}))}function O(t,e){function r(o,i,a,s){var u=d(t[o],t,i);if("throw"!==u.type){var f=u.arg,h=f.value;return h&&"object"==c(h)&&n.call(h,"__await")?e.resolve(h.__await).then((function(t){r("next",t,a,s)}),(function(t){r("throw",t,a,s)})):e.resolve(h).then((function(t){f.value=t,a(f)}),(function(t){return r("throw",t,a,s)}))}s(u.arg)}var i;o(this,"_invoke",{value:function(t,n){function o(){return new e((function(e,o){r(t,n,e,o)}))}return i=i?i.then(o,o):o()}})}function Y(e,r,n){var o=p;return function(i,a){if(o===y)throw Error("Generator is already running");if(o===m){if("throw"===i)throw a;return{value:t,done:!0}}for(n.method=i,n.arg=a;;){var s=n.delegate;if(s){var c=k(s,n);if(c){if(c===g)continue;return c}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(o===p)throw o=m,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);o=y;var u=d(e,r,n);if("normal"===u.type){if(o=n.done?m:v,u.arg===g)continue;return{value:u.arg,done:n.done}}"throw"===u.type&&(o=m,n.method="throw",n.arg=u.arg)}}}function k(e,r){var n=r.method,o=e.iterator[n];if(o===t)return r.delegate=null,"throw"===n&&e.iterator.return&&(r.method="return",r.arg=t,k(e,r),"throw"===r.method)||"return"!==n&&(r.method="throw",r.arg=new TypeError("The iterator does not provide a '"+n+"' method")),g;var i=d(o,e.iterator,r.arg);if("throw"===i.type)return r.method="throw",r.arg=i.arg,r.delegate=null,g;var a=i.arg;return a?a.done?(r[e.resultName]=a.value,r.next=e.nextLoc,"return"!==r.method&&(r.method="next",r.arg=t),r.delegate=null,g):a:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,g)}function E(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function _(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function j(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(E,this),this.reset(!0)}function T(e){if(e||""===e){var r=e[a];if(r)return r.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var o=-1,i=function r(){for(;++o<e.length;)if(n.call(e,o))return r.value=e[o],r.done=!1,r;return r.value=t,r.done=!0,r};return i.next=i}}throw new TypeError(c(e)+" is not iterable")}return b.prototype=M,o($,"constructor",{value:M,configurable:!0}),o(M,"constructor",{value:b,configurable:!0}),b.displayName=h(M,f,"GeneratorFunction"),e.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===b||"GeneratorFunction"===(e.displayName||e.name))},e.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,M):(t.__proto__=M,h(t,f,"GeneratorFunction")),t.prototype=Object.create($),t},e.awrap=function(t){return{__await:t}},L(O.prototype),h(O.prototype,s,(function(){return this})),e.AsyncIterator=O,e.async=function(t,r,n,o,i){void 0===i&&(i=Promise);var a=new O(l(t,r,n,o),i);return e.isGeneratorFunction(r)?a:a.next().then((function(t){return t.done?t.value:a.next()}))},L($),h($,f,"Generator"),h($,a,(function(){return this})),h($,"toString",(function(){return"[object Generator]"})),e.keys=function(t){var e=Object(t),r=[];for(var n in e)r.push(n);return r.reverse(),function t(){for(;r.length;){var n=r.pop();if(n in e)return t.value=n,t.done=!1,t}return t.done=!0,t}},e.values=T,j.prototype={constructor:j,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(_),!e)for(var r in this)"t"===r.charAt(0)&&n.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=t)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var r=this;function o(n,o){return s.type="throw",s.arg=e,r.next=n,o&&(r.method="next",r.arg=t),!!o}for(var i=this.tryEntries.length-1;i>=0;--i){var a=this.tryEntries[i],s=a.completion;if("root"===a.tryLoc)return o("end");if(a.tryLoc<=this.prev){var c=n.call(a,"catchLoc"),u=n.call(a,"finallyLoc");if(c&&u){if(this.prev<a.catchLoc)return o(a.catchLoc,!0);if(this.prev<a.finallyLoc)return o(a.finallyLoc)}else if(c){if(this.prev<a.catchLoc)return o(a.catchLoc,!0)}else{if(!u)throw Error("try statement without catch or finally");if(this.prev<a.finallyLoc)return o(a.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var o=this.tryEntries[r];if(o.tryLoc<=this.prev&&n.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var i=o;break}}i&&("break"===t||"continue"===t)&&i.tryLoc<=e&&e<=i.finallyLoc&&(i=null);var a=i?i.completion:{};return a.type=t,a.arg=e,i?(this.method="next",this.next=i.finallyLoc,g):this.complete(a)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),g},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),_(r),g}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var o=n.arg;_(r)}return o}}throw Error("illegal catch attempt")},delegateYield:function(e,r,n){return this.delegate={iterator:T(e),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=t),g}},e}function f(t,e,r,n,o,i,a){try{var s=t[i](a),c=s.value}catch(t){return void r(t)}s.done?e(c):Promise.resolve(c).then(n,o)}function h(){var t;return t=u().mark((function t(e,r,n){var o,i,a,c,f,h,l=arguments;return u().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(!(o=l.length>3&&void 0!==l[3]?l[3]:null)){t.next=5;break}t.t0={accessToken:o},t.next=8;break;case 5:return t.next=7,new Promise((function(t){chrome.storage.local.get(["accessToken"],(function(e){console.log("[sendReservations] Stored tokens:",e),t({accessToken:e.accessToken||""})}))}));case 7:t.t0=t.sent;case 8:if(i=t.t0,a=i.accessToken,c=a,console.log("[sendReservations] Using token:",{accessToken:c}),c){t.next=15;break}throw console.error("[sendReservations] No access token available"),new Error("No access token available. Please log in via frontend.");case 15:return t.prev=15,"Agoda"===r&&(n=n.map((function(t){if(t.checkIn instanceof Date){var e=t.checkIn.getTime()+324e5;t.checkIn=new Date(e)}if(t.checkOut instanceof Date){var r=t.checkOut.getTime()+324e5;t.checkOut=new Date(r)}return t}))),t.next=19,fetch("".concat(s,"/api/reservations-extension"),{method:"POST",headers:{Authorization:"Bearer ".concat(c),"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({siteName:r,reservations:n,hotelId:e})});case 19:if((f=t.sent).ok){t.next=26;break}return t.next=23,f.text();case 23:throw h=t.sent,console.error("[sendReservations] Server error:",f.status,h),new Error("Server responded with status ".concat(f.status,": ").concat(h));case 26:return console.log("[sendReservations] Sent reservations to ".concat(s,"/api/reservations-extension, hotelId=").concat(e)),t.abrupt("return",!0);case 30:return t.prev=30,t.t1=t.catch(15),console.error("[sendReservations] Failed:",t.t1),t.abrupt("return",!1);case 34:case"end":return t.stop()}}),t,null,[[15,30]])})),h=function(){var e=this,r=arguments;return new Promise((function(n,o){var i=t.apply(e,r);function a(t){f(i,n,o,a,s,"next",t)}function s(t){f(i,n,o,a,s,"throw",t)}a(void 0)}))},h.apply(this,arguments)}function l(t){return l="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},l(t)}function d(){d=function(){return e};var t,e={},r=Object.prototype,n=r.hasOwnProperty,o=Object.defineProperty||function(t,e,r){t[e]=r.value},i="function"==typeof Symbol?Symbol:{},a=i.iterator||"@@iterator",s=i.asyncIterator||"@@asyncIterator",c=i.toStringTag||"@@toStringTag";function u(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{u({},"")}catch(t){u=function(t,e,r){return t[e]=r}}function f(t,e,r,n){var i=e&&e.prototype instanceof w?e:w,a=Object.create(i.prototype),s=new j(n||[]);return o(a,"_invoke",{value:Y(t,r,s)}),a}function h(t,e,r){try{return{type:"normal",arg:t.call(e,r)}}catch(t){return{type:"throw",arg:t}}}e.wrap=f;var p="suspendedStart",v="suspendedYield",y="executing",m="completed",g={};function w(){}function b(){}function M(){}var D={};u(D,a,(function(){return this}));var S=Object.getPrototypeOf,x=S&&S(S(T([])));x&&x!==r&&n.call(x,a)&&(D=x);var $=M.prototype=w.prototype=Object.create(D);function L(t){["next","throw","return"].forEach((function(e){u(t,e,(function(t){return this._invoke(e,t)}))}))}function O(t,e){function r(o,i,a,s){var c=h(t[o],t,i);if("throw"!==c.type){var u=c.arg,f=u.value;return f&&"object"==l(f)&&n.call(f,"__await")?e.resolve(f.__await).then((function(t){r("next",t,a,s)}),(function(t){r("throw",t,a,s)})):e.resolve(f).then((function(t){u.value=t,a(u)}),(function(t){return r("throw",t,a,s)}))}s(c.arg)}var i;o(this,"_invoke",{value:function(t,n){function o(){return new e((function(e,o){r(t,n,e,o)}))}return i=i?i.then(o,o):o()}})}function Y(e,r,n){var o=p;return function(i,a){if(o===y)throw Error("Generator is already running");if(o===m){if("throw"===i)throw a;return{value:t,done:!0}}for(n.method=i,n.arg=a;;){var s=n.delegate;if(s){var c=k(s,n);if(c){if(c===g)continue;return c}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(o===p)throw o=m,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);o=y;var u=h(e,r,n);if("normal"===u.type){if(o=n.done?m:v,u.arg===g)continue;return{value:u.arg,done:n.done}}"throw"===u.type&&(o=m,n.method="throw",n.arg=u.arg)}}}function k(e,r){var n=r.method,o=e.iterator[n];if(o===t)return r.delegate=null,"throw"===n&&e.iterator.return&&(r.method="return",r.arg=t,k(e,r),"throw"===r.method)||"return"!==n&&(r.method="throw",r.arg=new TypeError("The iterator does not provide a '"+n+"' method")),g;var i=h(o,e.iterator,r.arg);if("throw"===i.type)return r.method="throw",r.arg=i.arg,r.delegate=null,g;var a=i.arg;return a?a.done?(r[e.resultName]=a.value,r.next=e.nextLoc,"return"!==r.method&&(r.method="next",r.arg=t),r.delegate=null,g):a:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,g)}function E(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function _(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function j(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(E,this),this.reset(!0)}function T(e){if(e||""===e){var r=e[a];if(r)return r.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var o=-1,i=function r(){for(;++o<e.length;)if(n.call(e,o))return r.value=e[o],r.done=!1,r;return r.value=t,r.done=!0,r};return i.next=i}}throw new TypeError(l(e)+" is not iterable")}return b.prototype=M,o($,"constructor",{value:M,configurable:!0}),o(M,"constructor",{value:b,configurable:!0}),b.displayName=u(M,c,"GeneratorFunction"),e.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===b||"GeneratorFunction"===(e.displayName||e.name))},e.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,M):(t.__proto__=M,u(t,c,"GeneratorFunction")),t.prototype=Object.create($),t},e.awrap=function(t){return{__await:t}},L(O.prototype),u(O.prototype,s,(function(){return this})),e.AsyncIterator=O,e.async=function(t,r,n,o,i){void 0===i&&(i=Promise);var a=new O(f(t,r,n,o),i);return e.isGeneratorFunction(r)?a:a.next().then((function(t){return t.done?t.value:a.next()}))},L($),u($,c,"Generator"),u($,a,(function(){return this})),u($,"toString",(function(){return"[object Generator]"})),e.keys=function(t){var e=Object(t),r=[];for(var n in e)r.push(n);return r.reverse(),function t(){for(;r.length;){var n=r.pop();if(n in e)return t.value=n,t.done=!1,t}return t.done=!0,t}},e.values=T,j.prototype={constructor:j,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(_),!e)for(var r in this)"t"===r.charAt(0)&&n.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=t)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var r=this;function o(n,o){return s.type="throw",s.arg=e,r.next=n,o&&(r.method="next",r.arg=t),!!o}for(var i=this.tryEntries.length-1;i>=0;--i){var a=this.tryEntries[i],s=a.completion;if("root"===a.tryLoc)return o("end");if(a.tryLoc<=this.prev){var c=n.call(a,"catchLoc"),u=n.call(a,"finallyLoc");if(c&&u){if(this.prev<a.catchLoc)return o(a.catchLoc,!0);if(this.prev<a.finallyLoc)return o(a.finallyLoc)}else if(c){if(this.prev<a.catchLoc)return o(a.catchLoc,!0)}else{if(!u)throw Error("try statement without catch or finally");if(this.prev<a.finallyLoc)return o(a.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var o=this.tryEntries[r];if(o.tryLoc<=this.prev&&n.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var i=o;break}}i&&("break"===t||"continue"===t)&&i.tryLoc<=e&&e<=i.finallyLoc&&(i=null);var a=i?i.completion:{};return a.type=t,a.arg=e,i?(this.method="next",this.next=i.finallyLoc,g):this.complete(a)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),g},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),_(r),g}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var o=n.arg;_(r)}return o}}throw Error("illegal catch attempt")},delegateYield:function(e,r,n){return this.delegate={iterator:T(e),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=t),g}},e}function p(t,e,r,n,o,i,a){try{var s=t[i](a),c=s.value}catch(t){return void r(t)}s.done?e(c):Promise.resolve(c).then(n,o)}function v(t,e){return"https://pms.coolstay.co.kr/motel-biz-pc/reservation?&page=1&searchType=ST602,ST608&searchExtra=".concat(t,"|").concat(e,",&sort=BOOK_DESC&tabState=0&selectSort=0&selectChannelOut=0&selectDateRange=customInput&selectEnterType=0")}console.log("[config.js] API_BASE_URL:",s),console.log("[config.js] NODE_ENV:","production"),console.log("[config.js] BACKEND_API_URL:","https://staysync.org"),e().extend(o()),e().extend(a()),console.log("[coolStay.js] content script loaded (DOM-based)");function y(t,r){var n=document.querySelector("#Reservation-Container");if(n){var o=(n.innerText||"").split("\n").map((function(t){return t.trim()})),i=[],a=null;o.forEach((function(t){if("복사"===t)return a&&i.push(a),void(a={});if(a){if(!a.reservationNo)return void(a.reservationNo=t);if(!a.customerName)return void(a.customerName=t);if(!a.safeNumber)return void(a.safeNumber=t);if(!a.roomInfo&&t.includes("|")&&t.includes("대실"))return void(a.roomInfo=t.replace("대실 | ","").trim());if(!a.checkIn&&t.includes("(입실)")&&t.includes("(퇴실)")){var e=t.split("~");if(2===e.length){var r=e[0].replace("(입실)","").trim(),n=e[1].replace("(퇴실)","").trim();a.checkIn=r,a.checkOut=n}return}if(!a.reservationDate&&t.includes("(예약)"))return void(a.reservationDate=t.replace("(예약)","").trim());if(!a.price&&t.match(/^\d{1,3}(,\d{3})*$/)){var o=t.replace(/,/g,"");return void(a.price=parseInt(o,10))}if(!a.paymentMethod&&(t.includes("신용/체크카드")||t.includes("계좌이체")))return void(a.paymentMethod=t)}})),a&&i.push(a),console.log("[coolStay.js] parsed reservations =>",i);var s=i.map((function(t){var n=e()(t.checkIn,"YYYY.MM.DD HH:mm"),o=e()(t.checkOut,"YYYY.MM.DD HH:mm"),i=e()(t.reservationDate,"YYYY.MM.DD HH:mm");return{reservationNo:t.reservationNo||"",customerName:t.customerName||"",roomInfo:t.roomInfo||"",checkIn:n.isValid()?n.format("YYYY-MM-DD HH:mm"):"",checkOut:o.isValid()?o.format("YYYY-MM-DD HH:mm"):"",reservationDate:i.isValid()?i.format("YYYY-MM-DD HH:mm"):"",price:t.price||0,phoneNumber:t.safeNumber||"",paymentMethod:t.paymentMethod||"Unknown",reservationStatus:"Confirmed",siteName:r}}));(function(t,e,r){return h.apply(this,arguments)})(t,r,s).then((function(){console.info("[coolStay.js] Sent ".concat(s.length," DOM-based reservations."))})).catch((function(t){console.error("[coolStay.js] DOM-based sendReservations error:",t)}))}else console.warn("[coolStay.js] #Reservation-Container not found => stop")}function m(){var t;return t=d().mark((function t(r){var n,o,i,a,s,c,u=arguments;return d().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(n=u.length>1&&void 0!==u[1]?u[1]:"CoolStay",console.log("[coolStay.js] Starting DOM-based scrape for CoolStay => hotelId=".concat(r,", siteName=").concat(n)),!window.location.pathname.includes("/login")){t.next=4;break}throw new Error("로그인 필요: CoolStay");case 4:if(window.location.href.includes("pms.coolstay.co.kr")){t.next=7;break}return console.warn("[coolStay.js] Not on pms.coolstay.co.kr => skip"),t.abrupt("return");case 7:return console.log("[coolStay.js] Initial waiting 2s to ensure DOM is rendered..."),t.next=10,new Promise((function(t){return setTimeout(t,2e3)}));case 10:if(o=e()().startOf("month"),i=e()().endOf("month"),a=o.format("YYYYMMDD"),s=i.format("YYYYMMDD"),c=v(a,s),window.location.href!==c){t.next=22;break}return console.log("[coolStay.js] Already on updatedURL => proceed parsing"),t.next=19,new Promise((function(t){return setTimeout(t,2e3)}));case 19:y(r,n),t.next=24;break;case 22:console.log("[coolStay.js] Navigating to updatedURL:",c),window.location.href=c;case 24:case"end":return t.stop()}}),t)})),m=function(){var e=this,r=arguments;return new Promise((function(n,o){var i=t.apply(e,r);function a(t){p(i,n,o,a,s,"next",t)}function s(t){p(i,n,o,a,s,"throw",t)}a(void 0)}))},m.apply(this,arguments)}chrome.runtime.onMessage.addListener((function(t,e,r){return"SCRAPE_COOLSTAY"===t.action&&(function(t){return m.apply(this,arguments)}(t.hotelId,t.siteName).then((function(){console.log("[coolStay.js] DOM-based scrapeCoolStay done"),r({success:!0})})).catch((function(t){console.error("[coolStay.js] DOM-based scrape error:",t),r({success:!1,message:t.message})})),!0)}))})()})();
//# sourceMappingURL=coolStay.bundle.js.map