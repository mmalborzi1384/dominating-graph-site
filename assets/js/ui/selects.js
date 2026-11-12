import { renderTextMath } from './math.js';
/** In-page nonmodal listboxes. Native selects remain the controllers' data/event interface. */
export function initGlassSelects() {
  const views = new Map(); let openView=null, serial=0;
  function close(returnFocus=false){if(!openView)return;const view=openView;view.menu.hidden=true;view.button.setAttribute('aria-expanded','false');view.wrapper.classList.remove('is-open');openView=null;if(returnFocus&&view.button.isConnected)view.button.focus();}
  function enhance(select){
    if(views.has(select)||select.multiple||select.size>1)return;
    const wrapper=document.createElement('div');wrapper.className='select-field';
    const button=document.createElement('button');button.type='button';button.className='glass-select-trigger';button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
    const label=select.getAttribute('aria-label') || [...(select.labels?.[0]?.childNodes??[])].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ') || 'انتخاب گزینه';
    const menu=document.createElement('div');menu.className='glass-select-menu glass-surface';menu.hidden=true;
    const search=document.createElement('input');search.type='search';search.className='glass-select-search';search.placeholder='جست‌وجوی گزینه‌ها…';search.setAttribute('aria-label','جست‌وجو در '+label);search.autocomplete='off';
    const list=document.createElement('div');list.className='glass-select-options';list.id=`glass-options-${++serial}`;list.setAttribute('role','listbox');list.setAttribute('aria-label',label);button.setAttribute('aria-controls',list.id);
    const empty=document.createElement('p');empty.className='select-empty';empty.textContent='گزینه‌ای با این عبارت پیدا نشد.';empty.hidden=true;menu.append(search,list,empty);
    select.before(wrapper);wrapper.append(select,button,menu);select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-hidden','true');
    const valueLabel=document.createElement('span');valueLabel.className='glass-select-value';valueLabel.id=list.id+'-value';const fieldLabel=document.createElement('span');fieldLabel.className='sr-only';fieldLabel.id=list.id+'-label';fieldLabel.textContent=label;button.append(fieldLabel,valueLabel);button.setAttribute('aria-labelledby',fieldLabel.id+' '+valueLabel.id);
    const view={select,wrapper,button,menu,search,list,empty,label};views.set(select,view);
    function options(){return [...list.querySelectorAll('[role=option]:not(:disabled)')];}
    function choose(option){if(select.disabled||option.disabled)return;select.value=option.value;close();select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));if(button.isConnected)button.focus();sync();}
    function renderOptions(){
      const filter=search.value.trim().toLocaleLowerCase('fa');list.replaceChildren();
      for(const option of select.options){if(filter&&!option.textContent.toLocaleLowerCase('fa').includes(filter))continue;const item=document.createElement('button');item.type='button';item.tabIndex=-1;item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.selected));item.className='glass-select-option';renderTextMath(item,option.textContent);item.disabled=option.disabled;item.addEventListener('click',()=>choose(option));list.append(item);}
      empty.hidden=list.childElementCount!==0;
    }
    function sync(){const option=select.selectedOptions[0];renderTextMath(valueLabel,option?.textContent??'انتخاب کن');button.disabled=select.disabled;search.hidden=select.options.length<10;if(openView===view){if(select.disabled)close();else renderOptions();}}
    view.sync=sync;
    function open(focusOption=false){if(select.disabled)return;close();openView=view;search.value='';sync();menu.hidden=false;button.setAttribute('aria-expanded','true');wrapper.classList.add('is-open');const box=button.getBoundingClientRect(),below=innerHeight-box.bottom,above=box.top;const up=below<220&&above>below;wrapper.classList.toggle('opens-up',up);menu.style.maxHeight=Math.max(120,Math.min(320,(up?above:below)-12))+'px';
      if(focusOption)(list.querySelector('[aria-selected=true]:not(:disabled)')??options()[0])?.focus();
    }
    button.addEventListener('click',()=>openView===view?close():open());
    button.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();if(openView!==view)open(true);else{const items=options();(event.key==='End'||event.key==='ArrowUp'?items.at(-1):items[0])?.focus();}}else if(event.key==='Escape'){event.preventDefault();close(true);}});
    menu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}if(event.key==='Tab'){close();return;}const items=options(),index=items.indexOf(document.activeElement);let next;if(event.key==='ArrowDown')next=items[(index+1)%items.length];if(event.key==='ArrowUp')next=items[(index-1+items.length)%items.length];if(event.key==='Home'&&document.activeElement!==search)next=items[0];if(event.key==='End'&&document.activeElement!==search)next=items.at(-1);if(next){event.preventDefault();next.focus();next.scrollIntoView({block:'nearest'});}});
    search.addEventListener('input',renderOptions);select.addEventListener('change',sync);select.addEventListener('focus',()=>button.focus());sync();
    view.observer=new MutationObserver(sync);view.observer.observe(select,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','selected','label']});
  }
  function scan(root){if(root.nodeType!==1)return;if(root.matches('select'))enhance(root);for(const select of root.querySelectorAll('select'))enhance(select);}
  scan(document.body);
  new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)scan(node);for(const [select,view]of views)if(!select.isConnected){view.observer.disconnect();views.delete(select);if(openView===view)close();}}).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('pointerdown',event=>{if(openView&&!openView.wrapper.contains(event.target))close();});
  document.addEventListener('tabchange',()=>close());document.addEventListener('focusin',event=>{if(openView&&!openView.wrapper.contains(event.target))close();});
}
