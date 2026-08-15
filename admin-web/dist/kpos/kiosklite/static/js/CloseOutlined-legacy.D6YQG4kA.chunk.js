(function(){System.register([`./toast-legacy.ByTKia61.chunk.js`,`./useTranslation-legacy.DCb02ctU.chunk.js`,`./classnames-legacy.BEKJQ2FG.chunk.js`,`./objectWithoutProperties-legacy.CQzXotnK.chunk.js`,`./es-legacy.D1C3emuW.chunk.js`],function(e,t){var n,r,i,a,o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A;function j(e){var t;return e==null||(t=e.getRootNode)==null?void 0:t.call(e)}function M(e){return j(e)instanceof ShadowRoot}function N(e){return M(e)?j(e):null}function P(e){return e.replace(/-(.)/g,function(e,t){return t.toUpperCase()})}function F(e,t){h(e,`[@ant-design/icons] ${t}`)}function I(e){return p(e)===`object`&&typeof e.name==`string`&&typeof e.theme==`string`&&(p(e.icon)===`object`||typeof e.icon==`function`)}function L(){var e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};return Object.keys(e).reduce(function(t,n){var r=e[n];switch(n){case`class`:t.className=r,delete t.class;break;default:delete t[n],t[P(n)]=r}return t},{})}function R(e,t,n){return n?x.createElement(e.tag,y(y({key:t},L(e.attrs)),n),(e.children||[]).map(function(n,r){return R(n,`${t}-${e.tag}-${r}`)})):x.createElement(e.tag,y({key:t},L(e.attrs)),(e.children||[]).map(function(n,r){return R(n,`${t}-${e.tag}-${r}`)}))}function z(e){return g(e)[0]}function B(e){return e?Array.isArray(e)?e:[e]:[]}function V(e){var t=e.primaryColor,n=e.secondaryColor;E.primaryColor=t,E.secondaryColor=n||z(t),E.calculated=!!n}function H(){return y({},E)}function U(e){var t=d(B(e),2),n=t[0],r=t[1];return D.setTwoToneColors({primaryColor:n,secondaryColor:r})}function W(){var e=D.getTwoToneColors();return e.calculated?[e.primaryColor,e.secondaryColor]:e.primaryColor}return e(`r`,N),{setters:[function(e){n=e.f,r=e.o},function(e){i=e._,a=e.g},function(e){o=e.t},function(e){s=e.S,c=e.b,l=e.i,u=e.n,d=e.r,f=e.t,p=e.x,m=e.y},function(e){h=e.f,g=e.i,_=e.s,v=e.t,y=e.u}],execute:function(){i(),b=n(o()),c(),l(),u(),x=n(r()),e(`i`,S=(0,x.createContext)({})),s(),C=`
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
`,w=function(e){var t=(0,x.useContext)(S),n=t.csp,r=t.prefixCls,i=t.layer,a=C;r&&(a=a.replace(/anticon/g,r)),i&&(a=`@layer ${i} {
${a}
}`),(0,x.useEffect)(function(){var t=e.current,r=N(t);_(a,`@ant-design-icons`,{prepend:!i,csp:n,attachTo:r})},[])},T=[`icon`,`className`,`onClick`,`style`,`primaryColor`,`secondaryColor`],E={primaryColor:`#333`,secondaryColor:`#E6E6E6`,calculated:!1},D=function(e){var t=e.icon,n=e.className,r=e.onClick,i=e.style,a=e.primaryColor,o=e.secondaryColor,s=f(e,T),c=x.useRef(),l=E;if(a&&(l={primaryColor:a,secondaryColor:o||z(a)}),w(c),F(I(t),`icon should be icon definiton, but got ${t}`),!I(t))return null;var u=t;return u&&typeof u.icon==`function`&&(u=y(y({},u),{},{icon:u.icon(l.primaryColor,l.secondaryColor)})),R(u.icon,`svg-${u.name}`,y(y({className:n,onClick:r,style:i,"data-icon":u.name,width:`1em`,height:`1em`,fill:`currentColor`,"aria-hidden":`true`},s),{},{ref:c}))},D.displayName=`IconReact`,D.getTwoToneColors=H,D.setTwoToneColors=V,l(),u(),O=[`className`,`icon`,`spin`,`rotate`,`tabIndex`,`onClick`,`twoToneColor`],U(v.primary),e(`n`,k=x.forwardRef(function(e,t){var n=e.className,r=e.icon,i=e.spin,o=e.rotate,s=e.tabIndex,c=e.onClick,l=e.twoToneColor,u=f(e,O),p=x.useContext(S),h=p.prefixCls,g=h===void 0?`anticon`:h,_=p.rootClassName,v=(0,b.default)(_,g,m(m({},`${g}-${r.name}`,!!r.name),`${g}-spin`,!!i||r.name===`loading`),n),y=s;y===void 0&&c&&(y=-1);var C=o?{msTransform:`rotate(${o}deg)`,transform:`rotate(${o}deg)`}:void 0,w=d(B(l),2),T=w[0],E=w[1];return x.createElement(`span`,a({role:`img`,"aria-label":r.name},u,{ref:t,tabIndex:y,onClick:c,className:v}),x.createElement(D,{icon:r,primaryColor:T,secondaryColor:E,style:C}))})),k.displayName=`AntdIcon`,k.getTwoToneColor=W,k.setTwoToneColor=U,A={icon:{tag:`svg`,attrs:{"fill-rule":`evenodd`,viewBox:`64 64 896 896`,focusable:`false`},children:[{tag:`path`,attrs:{d:`M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z`}}]},name:`close`,theme:`outlined`},i(),e(`t`,x.forwardRef(function(e,t){return x.createElement(k,a({},e,{ref:t,icon:A}))}))}}})})();