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
    let ul = document.createElement('ul');

    ui.setAttribute('class', 'lui-check');
    ui.append(header);
    ui.append(ul);

    let updateHeader = function () {
      header.innerText = Object.values(checkedMap).toString();
    };

    //生成选项
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