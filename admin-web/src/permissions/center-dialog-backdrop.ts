/** Close only a complete primary-pointer click on the native dialog backdrop. */
export function bindDialogBackdropClose(dialog:HTMLDialogElement):void {
  const outside=(event:MouseEvent)=>{
    const rect=dialog.getBoundingClientRect();
    return event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom);
  };
  let startedOutside=false;
  dialog.addEventListener('pointerdown',event=>{startedOutside=event.button===0&&outside(event);});
  dialog.addEventListener('pointercancel',()=>{startedOutside=false;});
  dialog.addEventListener('click',event=>{
    const shouldClose=startedOutside&&event.button===0&&outside(event);startedOutside=false;
    if(shouldClose)dialog.close();
  });
}
