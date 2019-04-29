const X = {

  /**
   * 字节数转友好文字
   * @param bytesLength 字节数
   * @returns {string}
   */
  bytesLengthToText(bytesLength) {
    let text = bytesLength + " B";
    // optional code for multiples approximation
    for (let aMultiples = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"], nMultiple = 0, nApprox = bytesLength / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
      text = nApprox.toFixed(1) + " " + aMultiples[nMultiple];
    }
    return text;
  },

  initInfo(ipfs) {
    let table = document.querySelector('body > table.info');
    let versionE = table.querySelector('td[data-id="version"]');
    let peersCountE = table.querySelector('td[data-id="peers-count"]');
    let sendE = table.querySelector('td[data-id="send"]');
    let receiveE = table.querySelector('td[data-id="receive"]');
    let peersListE = document.querySelector('div.peers-list');

    ipfs.version((err, version) => {
      if (err) {
        throw err
      }
      versionE.textContent = `版本：${version.version}`;
    });

    window.setInterval(() => {
      ipfs.swarm.peers()
          .then(results => {
            peersCountE.textContent = `节点：${results.length}`;

            peersListE.innerHTML = '';
            for (let info of results) {
              let div = document.createElement('div');
              div.textContent = info.addr;
              peersListE.append(div);
            }
          });

      ipfs.stats.bw()
          .then(result => {
            sendE.textContent = `发送：${X.bytesLengthToText(result.totalOut)}`;
            receiveE.textContent = `接收：${X.bytesLengthToText(result.totalIn)}`;
          });
    }, 1000);
  },

  initShare(ipfs) {
    let shareListE = document.querySelector('ul.share-list');
    let footer = document.querySelector('body > footer');
    let buttonE = footer.querySelector('button.share');
    let progressE = footer.querySelector('div.progress');

    let share = () => {
      let input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.addEventListener('change', () => {
        let file = input.files[0];
        const FileSize = file.size;
        console.debug('分享文件:', file);

        footer.classList.add('progress');

        let reader = new FileReader();
        reader.onload = evt => {
          const path = `${file.name}`;
          const content = window.Ipfs.Buffer.from(evt.target.result);
          ipfs.add(
              [
                {path: path, content: content}
              ],
              {
                wrapWithDirectory: true,
                progress: (length) => {
                  let percent = (length / FileSize * 100).toFixed(0);
                  console.debug('添加完成比例:', percent);

                  if (percent < 100) {
                    setTimeout(() => {
                      progressE.innerHTML = `<div class="progress-bar" style="width: ${percent}%;"></div>
                        <div class="progress-text">${file.name} 已经分享： ${percent}%</div>`;
                    }, 20);
                  }
                }
              })
              .then((results) => {
                console.debug('上传完毕:', results);

                progressE.innerHTML = '';
                footer.classList.remove('progress');

                const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?qm=${results[1].hash}`;
                let li = document.createElement('li');
                let input = document.createElement('input');
                let span = document.createElement('span');
                input.setAttribute('readonly', 'readonly');
                input.value = url;
                span.textContent = `点下上方绿色方块复制链接，发送给对方后点击即可下载：${results[0].path}`;
                li.append(input);
                li.append(span);
                shareListE.append(li);

                input.addEventListener('click', evt => {
                  evt.target.select();
                  document.execCommand('copy');
                });
              });
        };
        reader.readAsArrayBuffer(file);
      });
      input.click();
    };

    buttonE.addEventListener('click', share);
  },

  download(ipfs, qm) {
    let shareListE = document.querySelector('ul.share-list');
    let stream = ipfs.lsReadableStream(qm);
    stream.on('data', (file) => {
      console.debug('文件:', file);
      let name = file.name;

      //构建视图
      let li = document.createElement('li');
      li.innerHTML = `<div class="progress"></div>`;
      shareListE.append(li);
      let progressE = li.querySelector('.progress');

      let stream = ipfs.getReadableStream(file.path);
      stream.on('data', (file) => {
        const FileSize = file.size;
        let buf = window.Ipfs.Buffer.from(new Uint8Array());
        if (file.type === 'file') {
          file.content.on('data', (data) => {
            buf = window.Ipfs.Buffer.concat([buf, data]);

            //显示进度
            const percent = (buf.length / FileSize * 100).toFixed(0);
            console.debug('下载比例:', percent);
            progressE.innerHTML = `<div class="progress-bar" style="width: ${percent}%;"></div>
                        <div class="progress-text">${name} 已经下载： ${percent}%</div>`;

            //下载完毕
            if (buf.length === FileSize) {
              const objectURL = URL.createObjectURL(
                  new Blob([buf])
              );
              let a = document.createElement('a');
              a.textContent = `下载：${name}`;
              a.setAttribute('href', objectURL);
              a.setAttribute('download', name);
              a.click();

              li.innerHTML = '';
              let button = document.createElement('button');
              button.textContent = `下载：${name}`;
              button.addEventListener('click', () => {
                a.click();
              });
              li.append(button);
            }
          });
          file.content.resume()
        }
      });
    });
  },

  init() {
    const qm = new URL(document.location.href).searchParams.get('qm');
    const ipfs = new window.Ipfs({
      config: {
        Addresses: {
          Swarm: [
            '/dns4/wrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star',
            '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
          ]
        }
      }
    });
    this.ipfs = ipfs;

    ipfs.on('ready', () => {
      console.info('火星文件就绪');

      X.initInfo(ipfs);
      X.initShare(ipfs);

      if (qm) {
        X.download(ipfs, qm);
      }

      let inputE = document.querySelector('input[name="qm"]');
      inputE.addEventListener('input', () => {
        let qm = inputE.value;
        if (qm.length > 46) {
          qm = qm.substring(
              qm.lastIndexOf('=') + 1
          );
        }

        if (qm.length === 46) {
          inputE.value = '';
          X.download(ipfs, qm);
        }
      });
    });

    ipfs.on('error', error => {
      console.error(error);
    });

    ipfs.on('stop', () => {
      console.info('火星文件停止');
    });
  }
};