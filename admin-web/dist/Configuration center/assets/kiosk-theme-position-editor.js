/* Single-position first step shared by the native ad create/edit pages. */
(function(root) {
  'use strict';
  function mount(config) {
    var form = document.getElementById(config.formId);
    var action = document.getElementById(config.nextId);
    var title = document.querySelector('header h1');
    var originalTitle = title.textContent;
    var progress = document.querySelector('.step-progress-inner');
    var saved = KioskThemePositions.savedForTheme(config.theme);
    var selected = saved.length === 1 ? saved[0] : '';
    var editing = config.formId === 'editForm';
    var picking = !selected;
    var section = document.createElement('section');
    section.className = 'mx-auto w-full max-w-2xl rounded-2xl border border-[#f0f0f0] bg-white p-8 shadow-sm';
    section.setAttribute('aria-labelledby','adPositionTitle');
    section.innerHTML = '<h2 id="adPositionTitle" class="mb-2 text-base font-medium">展示位置 <span class="text-red-500">*</span></h2>' +
      '<p class="mb-6 text-sm text-gray-500">请选择一个展示位置，下一步配置广告内容</p>' +
      '<div class="grid grid-cols-2 gap-3" role="radiogroup" aria-label="展示位置">' +
      KioskThemePositions.options.map(function(option) {
        return '<label class="ad-position-option flex cursor-pointer items-center gap-3 rounded-xl border border-[#d9d9d9] p-4"><input type="radio" name="adPosition" value="' + option.value + '"' + (option.value === selected ? ' checked' : '') + '><span>' + option.label + '</span></label>';
      }).join('') + '</div>' +
      '<p class="mt-5 text-xs text-gray-500">屏保：竖版1080×1920，横版1920×1080；首页：竖版1080×1250，横版1440×1080。</p>';
    if (saved.length > 1) {
      var hint = document.createElement('p'); hint.className = 'mt-4 text-sm text-amber-600';
      hint.textContent = '此广告包含多个展示位置，请选择一个位置后继续；保存前不改变已有配置。';section.appendChild(hint);
    }
    form.before(section);
    var next = document.createElement('button');next.type = 'button';next.id = 'positionNextBtn';
    next.className = action.className;next.textContent = '下一步';action.before(next);
    var summary = document.createElement('div');summary.className = 'mb-5 flex items-center justify-between gap-4 text-sm';
    summary.innerHTML = '<span id="adPositionSummary"></span><button type="button" id="changeAdPosition" class="text-primary hover:underline">修改展示位置</button>';
    form.prepend(summary);
    function refresh() {
      section.style.display = picking ? '' : 'none';form.style.display = picking ? 'none' : '';
      action.style.display = picking ? 'none' : '';next.style.display = picking ? '' : 'none';
      next.disabled = !section.querySelector('input:checked');
      next.style.opacity = next.disabled ? '0.45' : '';
      next.style.cursor = next.disabled ? 'not-allowed' : '';
      title.textContent = picking ? '选择展示位置' : originalTitle;
      if (progress) progress.style.width = picking ? '20%' : '40%';
      var option = KioskThemePositions.options.filter(function(item){return item.value === selected;})[0];
      summary.querySelector('span').textContent = '展示位置：' + (option ? option.label : '未配置');
      section.querySelectorAll('.ad-position-option').forEach(function(label){
        var checked = label.querySelector('input').checked;
        label.style.borderColor = checked ? '#1677ff' : '';
        label.style.backgroundColor = checked ? '#e6f4ff' : '';
      });
    }
    section.addEventListener('change',refresh);
    next.addEventListener('click',function(){
      var checked = section.querySelector('input:checked');if (!checked) return;
      selected = checked.value;picking = false;refresh();config.onChange();
    });
    summary.querySelector('button').addEventListener('click',function(){picking = true;refresh();});
    refresh();
    return {
      value:function(){return selected;},
      back:function(){if (editing || picking) return false;picking = true;refresh();return true;}
    };
  }
  root.KioskThemePositionEditor = {mount:mount};
})(window);
