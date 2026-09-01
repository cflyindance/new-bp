import{f as e,o as t}from"./toast.CSCQL6mj.chunk.js";import{_ as n,g as r}from"./useTranslation.B73sylN6.chunk.js";import{t as i}from"./classnames.xxiZCMnm.chunk.js";import{S as a,b as o,i as s,n as c,r as l,t as u,x as d,y as f}from"./objectWithoutProperties.CBsK4NMA.chunk.js";import{f as p,i as m,s as h,t as g,u as _}from"./es.qVjuCDAb.chunk.js";n();var v=e(i());o(),s(),c();var y=e(t()),b=(0,y.createContext)({});a();function x(e){var t;return e==null||(t=e.getRootNode)==null?void 0:t.call(e)}function S(e){return x(e)instanceof ShadowRoot}function C(e){return S(e)?x(e):null}function w(e){return e.replace(/-(.)/g,function(e,t){return t.toUpperCase()})}function T(e,t){p(e,`[@ant-design/icons] ${t}`)}function E(e){return d(e)===`object`&&typeof e.name==`string`&&typeof e.theme==`string`&&(d(e.icon)===`object`||typeof e.icon==`function`)}function D(){var e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};return Object.keys(e).reduce(function(t,n){var r=e[n];switch(n){case`class`:t.className=r,delete t.class;break;default:delete t[n],t[w(n)]=r}return t},{})}function O(e,t,n){return n?y.createElement(e.tag,_(_({key:t},D(e.attrs)),n),(e.children||[]).map(function(n,r){return O(n,`${t}-${e.tag}-${r}`)})):y.createElement(e.tag,_({key:t},D(e.attrs)),(e.children||[]).map(function(n,r){return O(n,`${t}-${e.tag}-${r}`)}))}function k(e){return m(e)[0]}function A(e){return e?Array.isArray(e)?e:[e]:[]}var j=`
.anticon {
  display: inline-flex;
  align-items: center;
  color: inherit;
  font-style: normal;
  line-height: 0;
  text-align: center;
  text-transform: none;
  vertical-align: -0.125em;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.anticon > * {
  line-height: 1;
}

.anticon svg {
  display: inline-block;
}

.anticon::before {
  display: none;
}

.anticon .anticon-icon {
  display: block;
}

.anticon[tabindex] {
  cursor: pointer;
}

.anticon-spin::before,
.anticon-spin {
  display: inline-block;
  -webkit-animation: loadingCircle 1s infinite linear;
  animation: loadingCircle 1s infinite linear;
}

@-webkit-keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
`,M=function(e){var t=(0,y.useContext)(b),n=t.csp,r=t.prefixCls,i=t.layer,a=j;r&&(a=a.replace(/anticon/g,r)),i&&(a=`@layer ${i} {
${a}
}`),(0,y.useEffect)(function(){var t=e.current,r=C(t);h(a,`@ant-design-icons`,{prepend:!i,csp:n,attachTo:r})},[])},N=[`icon`,`className`,`onClick`,`style`,`primaryColor`,`secondaryColor`],P={primaryColor:`#333`,secondaryColor:`#E6E6E6`,calculated:!1};function F(e){var t=e.primaryColor,n=e.secondaryColor;P.primaryColor=t,P.secondaryColor=n||k(t),P.calculated=!!n}function I(){return _({},P)}var L=function(e){var t=e.icon,n=e.className,r=e.onClick,i=e.style,a=e.primaryColor,o=e.secondaryColor,s=u(e,N),c=y.useRef(),l=P;if(a&&(l={primaryColor:a,secondaryColor:o||k(a)}),M(c),T(E(t),`icon should be icon definiton, but got ${t}`),!E(t))return null;var d=t;return d&&typeof d.icon==`function`&&(d=_(_({},d),{},{icon:d.icon(l.primaryColor,l.secondaryColor)})),O(d.icon,`svg-${d.name}`,_(_({className:n,onClick:r,style:i,"data-icon":d.name,width:`1em`,height:`1em`,fill:`currentColor`,"aria-hidden":`true`},s),{},{ref:c}))};L.displayName=`IconReact`,L.getTwoToneColors=I,L.setTwoToneColors=F;function R(e){var t=l(A(e),2),n=t[0],r=t[1];return L.setTwoToneColors({primaryColor:n,secondaryColor:r})}function z(){var e=L.getTwoToneColors();return e.calculated?[e.primaryColor,e.secondaryColor]:e.primaryColor}s(),c();var B=[`className`,`icon`,`spin`,`rotate`,`tabIndex`,`onClick`,`twoToneColor`];R(g.primary);var V=y.forwardRef(function(e,t){var n=e.className,i=e.icon,a=e.spin,o=e.rotate,s=e.tabIndex,c=e.onClick,d=e.twoToneColor,p=u(e,B),m=y.useContext(b),h=m.prefixCls,g=h===void 0?`anticon`:h,_=m.rootClassName,x=(0,v.default)(_,g,f(f({},`${g}-${i.name}`,!!i.name),`${g}-spin`,!!a||i.name===`loading`),n),S=s;S===void 0&&c&&(S=-1);var C=o?{msTransform:`rotate(${o}deg)`,transform:`rotate(${o}deg)`}:void 0,w=l(A(d),2),T=w[0],E=w[1];return y.createElement(`span`,r({role:`img`,"aria-label":i.name},p,{ref:t,tabIndex:S,onClick:c,className:x}),y.createElement(L,{icon:i,primaryColor:T,secondaryColor:E,style:C}))});V.displayName=`AntdIcon`,V.getTwoToneColor=z,V.setTwoToneColor=R;var H={icon:{tag:`svg`,attrs:{"fill-rule":`evenodd`,viewBox:`64 64 896 896`,focusable:`false`},children:[{tag:`path`,attrs:{d:`M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z`}}]},name:`close`,theme:`outlined`};n();var U=y.forwardRef(function(e,t){return y.createElement(V,r({},e,{ref:t,icon:H}))});export{b as i,V as n,C as r,U as t};