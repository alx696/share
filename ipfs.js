const X = {

  initShare() {
    const s = this;
    const ipfs = s.ipfs;

    s.progressText.innerHTML = '分享文件';
    s.progressText.style.cursor = 'pointer';

    let share = () => {
      s.progressText.style.cursor = 'wait';

      let input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.addEventListener('change', () => {
        let file = input.files[0];
        console.debug('分享文件:', file);
        let reader = new FileReader();
        reader.onload = evt => {
          const path = `${file.name}`;
          const content = ipfs.types.Buffer.from(evt.target.result);
          ipfs.files.add(
              [
                {path: path, content: content}
              ],
              {
                wrapWithDirectory: true,
                progress: (length) => {
                  const percent = (length / file.size * 100).toFixed(0);
                  console.debug('上传比例:', percent);
                  //显示进度
                  s.progressText.innerHTML = `${percent}%`;
                  s.progressColor.style.width = `${percent}%`;
                }
              })
              .then((results) => {
                console.debug('上传完毕:', results);
                const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?qm=${results[1].hash}`;
                s.progressColor.style.width = 0;
                s.progressText.innerHTML = `
                  <label for="hash${Date.now()}">复制分享链接:</label>
                  <input id="hash${Date.now()}" readonly value="${url}">
                `;

                s.progressText.querySelector('input')
                    .addEventListener('click', evt => {
                      evt.target.select();
                      const isCopy = document.execCommand('copy');
                      console.warn(isCopy);
                    });
              });
        };
        reader.readAsArrayBuffer(file);
      });
      input.click();
    };

    s.progressText.addEventListener('click', share, {once: true});
  },

  initDownload(qm) {
    const s = this;
    const ipfs = s.ipfs;
    let ipfsPath = '/ipfs/' + qm;
    console.debug('IPFS路径:', ipfsPath);

    ipfs.files.ls(ipfsPath, {long: true})
        .then(results => {
          console.debug('IPFS路径中文件:', results);

          let stream = ipfs.files.getReadableStream(results[0].hash);
          stream.on('data', (file) => {
            let buf = ipfs.types.Buffer.from(new Uint8Array());
            console.debug('---文件:', file);
            if (file.type !== 'dir') {
              file.content.on('data', (data) => {
                buf = ipfs.types.Buffer.concat([buf, data]);

                const percent = (buf.length / file.size * 100).toFixed(0);
                console.debug('下载比例:', percent);
                //显示进度
                s.progressText.innerHTML = `${percent}%`;
                s.progressColor.style.width = `${percent}%`;

                if (buf.length === file.size) {
                  const objectURL = URL.createObjectURL(
                      new Blob([buf])
                  );
                  let a = document.createElement('a');
                  a.textContent = `点击下载：${results[0].name}`;
                  a.setAttribute('href', objectURL);
                  a.setAttribute('download', results[0].name);
                  s.progressColor.style.width = 0;
                  s.progressText.innerHTML = '';
                  s.progressText.append(a);
                  //自动下载
                  a.click();
                }
              });
              file.content.resume()
            }
          });
        });
  },

  lengthToText(bytesLength) {
    let text = bytesLength + " B";
    // optional code for multiples approximation
    for (let aMultiples = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"], nMultiple = 0, nApprox = bytesLength / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
      text = nApprox.toFixed(1) + " " + aMultiples[nMultiple];
    }
    return text;
  },

  updateInfo() {
    const s = this;
    const ipfs = s.ipfs;

    ipfs.swarm.peers()
        .then(results => {
          s.peerCount.textContent = results.length;
        });

    ipfs.stats.bw()
        .then(result => {
          s.bandwidthTotalOut.textContent = `${s.lengthToText(result.totalOut)}`;
          s.bandwidthTotalIn.textContent = `${s.lengthToText(result.totalIn)}`;
        });
  },

  init() {
    const s = this;
    const ipfs = new window.Ipfs();
    s.ipfs = ipfs;
    const qm = new URL(document.location.href).searchParams.get('qm');

    s.progressColor = document.getElementById('progressColor');
    s.progressText = document.getElementById('progressText');
    s.agentVersion = document.getElementById('agentVersion');
    s.peerCount = document.getElementById('peerCount');
    s.bandwidthTotalOut = document.getElementById('bandwidthTotalOut');
    s.bandwidthTotalIn = document.getElementById('bandwidthTotalIn');

    /*inputFile.addEventListener('change', () => {
      let file = inputFile.files[0];
      console.debug('上传文件:', file);
      let reader = new FileReader();
      reader.onload = evt => {
        const path = `${file.name}`;
        const content = ipfs.types.Buffer.from(evt.target.result);
        ipfs.files.add(
            [{path: path, content: content}],
            {
              wrapWithDirectory: true,
              progress: (length) => {
                console.debug('上传比例:', length / file.size);
              }
            })
            .then((results) => {
              console.debug('上传完毕:', results);
              console.debug('包装哈希:', results[1].hash);
            });
      };
      reader.readAsArrayBuffer(file);
    });*/

    /*inputHash.addEventListener('change', () => {
      let ipfsPath = '/ipfs/' + inputHash.value;
      console.debug('IPFS路径:', ipfsPath);
      ipfs.files.ls(ipfsPath, {long: true})
          .then(results => {
            console.debug('IPFS路径中文件:', results);

            let stream = ipfs.files.getReadableStream(results[0].hash);
            stream.on('data', (file) => {
              let buf = ipfs.types.Buffer.from(new Uint8Array());
              console.debug('---文件:', file);
              if (file.type !== 'dir') {
                file.content.on('data', (data) => {
                  buf = ipfs.types.Buffer.concat([buf, data]);
                  console.debug('下载比例:', buf.length / file.size);
                });
                file.content.resume()
              }
            });
          });
    });*/

    ipfs.on('ready', () => {
      console.info('IPFS就绪');

      ipfs.id()
          .then(identity => {
            console.info('ID:', identity);

            s.agentVersion.textContent = identity.agentVersion;
          });

      if (qm) {
        s.initDownload(qm);
      } else {
        s.initShare();
      }

      //更新信息
      X.updateInfo();
      window.setInterval(() => {
        X.updateInfo();
      }, 1000);
    });
  }
};