class LuiCheck {
  /**
   * 创建选择
   * @param container 放置选框的element
   * @param multiple 是否多选
   * @param map 键为id值为文字{'id1':'文字1','id2':'文字2'}
   * @param values 默认值['id1']
   */
  constructor(container, multiple, map, values) {
    let checkedMap = {};
    this.checkedMap = checkedMap;

    let ui = document.createElement('div');
    let header = document.createElement('header');
    let headerText = document.createElement('div');
    let headerAside = document.createElement('aside');
    let toolbar = document.createElement('div');
    let ul = document.createElement('ul');

    ui.setAttribute('class', 'lui-check');
    header.append(headerText);
    header.append(headerAside);
    header.append();
    ui.append(header);
    ui.append(toolbar);
    ui.append(ul);

    //生成选项
    let updateHeader = function () {
      headerText.innerText = Object.values(checkedMap).toString();
    };
    for (let key in map) {
      let li = document.createElement('li');
      li.append(map[key]);
      ul.append(li);

      li.addEventListener('click', () => {
        if (li.classList.toggle('checked')) {
          //选中
          if (!multiple) {
            checkedMap = {};
            for (let e of ul.querySelectorAll('li.checked')) {
              e.classList.remove('checked');
            }
            li.classList.add('checked');
          }
          checkedMap[key] = map[key];
        } else {
          //去除选择
          delete checkedMap[key];
        }
        updateHeader();
      });

      if (values && values.indexOf(key) !== -1) {
        li.dispatchEvent(new Event('click'));
      }
    }

    //生成工具
    let lis = ul.children;
    if(multiple) {
      let buttonSelect = document.createElement('button');
      buttonSelect.append('反选');
      buttonSelect.addEventListener('click', () => {
        for (let li of lis) {
          li.dispatchEvent(new Event('click'));
        }
      });

      toolbar.append(buttonSelect);
    }
    let inputSearch = document.createElement('input');
    inputSearch.setAttribute('type', 'search');
    inputSearch.setAttribute('placeholder', '输入关键词筛选');
    inputSearch.addEventListener('input', () => {
      let v = inputSearch.value;
      for (let li of lis) {
        if(v.length > 0 && !li.innerText.includes(v)) {
          //隐藏
          li.classList.add('hide');
        } else {
          //显示
          li.classList.remove('hide');
        }
      }
    });
    toolbar.append(inputSearch);

    container.append(ui);
  }

  /**
   * 获取选中
   * @returns {'id1':'文字1','id2':'文字2'}
   */
  getCheck() {
    return this.checkedMap;
  }
}