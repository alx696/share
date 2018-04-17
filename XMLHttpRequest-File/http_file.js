/**
 * 文件上传及下载
 * <p>参考https://www.html5rocks.com/zh/tutorials/file/xhr2/</p>
 * <p>参考https://gist.github.com/zynick/12bae6dbc76f6aacedf0</p>
 */
class HttpFile {
  /**
   * 上传
   * @param file File
   * @param name [可选]自定义名称
   * @returns {Promise<any>} 文件id
   */
  upload(file, name) {
    return new Promise(
        (resolve, reject) => {
          if (!name) {
            name = file.name;
          }
          console.debug('上传文件', file, name);

          let formData = new FormData();
          formData.append("file", file);
          formData.append("name", name);

          let xhr = new XMLHttpRequest();
          xhr.open('POST', 'http://localhost:6001/file/');
          xhr.addEventListener('error', () => {
            reject('错误');
          });
          xhr.addEventListener('progress', (evt) => {
            if (evt.lengthComputable) {
              let percentComplete = evt.loaded / evt.total;
              console.debug('完成比例:', percentComplete);
            }
          });
          xhr.addEventListener('load', (evt) => {
            if (evt.target.readyState === 4 && evt.target.status === 200) {
              let fileId = evt.target.responseText;
              console.debug('文件Id', fileId);
              resolve(fileId);
            } else {
              reject('上传失败:' + evt.target.status);
            }
          });
          xhr.send(formData);
        }
    );
  }

  /**
   * 下载
   * @param fileId 文件id
   * @param onProgress [可选]下载进度(0.0-1的小数)
   * @returns {Promise<any>}
   */
  download(fileId, onProgress) {
    return new Promise(
        (resolve, reject) => {
          console.debug('下载文件', fileId);

          let xhr = new XMLHttpRequest();
          xhr.addEventListener('error', () => {
            reject('错误');
          });
          xhr.addEventListener('progress', (evt) => {
            if (evt.lengthComputable) {
              let percentComplete = evt.loaded / evt.total;
              console.debug('完成比例:', percentComplete);
              if (onProgress) {
                onProgress(percentComplete);
              }
            }
          });
          xhr.open('GET', 'http://localhost:6001/file/' + fileId);
          xhr.responseType = 'blob';
          xhr.addEventListener('load', () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
              let blob = xhr.response;
              let blobUrl = window.URL.createObjectURL(blob);
              let filename = xhr.getResponseHeader('filename');

              let a = document.createElement('a');
              a.setAttribute('href', blobUrl);
              a.setAttribute('download', filename);
              a.append('自动下载');
              a.style = 'display:none';
              document.body.appendChild(a);
              a.click();
              //清理资源
              window.setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
              }, 100);

              resolve();
            } else {
              reject('下载失败:' + xhr.status);
            }
          });
          xhr.send();
        }
    );
  }
}