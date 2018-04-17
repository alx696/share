import constant.RocksDatabase;
import io.netty.buffer.Unpooled;
import io.netty.channel.*;
import io.netty.handler.codec.http.*;
import io.netty.handler.codec.http.multipart.*;
import io.netty.handler.ssl.SslHandler;
import io.netty.handler.stream.ChunkedFile;
import io.netty.util.CharsetUtil;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.rocksdb.RocksDB;
import org.rocksdb.RocksDBException;
import util.AppProperties;
import util.Rocks;

import javax.activation.MimetypesFileTypeMap;
import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static io.netty.handler.codec.http.HttpResponseStatus.*;
import static io.netty.handler.codec.http.HttpVersion.HTTP_1_1;

public class HttpServerHandler extends SimpleChannelInboundHandler<FullHttpRequest> {

  private static final Logger L = LogManager.getLogger();
  private static final String FILE_DIR = AppProperties.getInstance().getProperty("FILE.DIR");
  private static final RocksDB FILE_DB = Rocks.getInstance().open(RocksDatabase.FILE);
  private static final HttpDataFactory factory =
      new DefaultHttpDataFactory(DefaultHttpDataFactory.MINSIZE); // Disk if size exceed
  private static final String HTTP_DATE_FORMAT = "EEE, dd MMM yyyy HH:mm:ss zzz";
  private static final String HTTP_DATE_GMT_TIMEZONE = "GMT";
  private static final int HTTP_CACHE_SECONDS = 60;

  static {
    DiskFileUpload.deleteOnExitTemporaryFile = true; // should delete file
    // on exit (in normal exit)
    DiskFileUpload.baseDirectory = null; // system temp directory
    DiskAttribute.deleteOnExitTemporaryFile = true; // should delete file on
    // exit (in normal exit)
    DiskAttribute.baseDirectory = null; // system temp directory
  }

  private static void sendError(ChannelHandlerContext ctx, HttpResponseStatus status) {
    FullHttpResponse response = new DefaultFullHttpResponse(
        HTTP_1_1, status, Unpooled.copiedBuffer("Failure: " + status + "\r\n", CharsetUtil.UTF_8));
    response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain; charset=UTF-8");

    // Close the connection as soon as the error message is sent.
    ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
  }

  private static void sendResponse(ChannelHandlerContext ctx, String text) {
    FullHttpResponse response = new DefaultFullHttpResponse(
        HTTP_1_1, OK, Unpooled.copiedBuffer(text, CharsetUtil.UTF_8)
    );
    response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain; charset=UTF-8");
    response.headers().set(HttpHeaderNames.CONTENT_LENGTH, text.length());
    response.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_ORIGIN, "*");
    response.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_METHODS, "POST");

    // Close the connection as soon as the error message is sent.
    ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
  }

  private void fileUpload(ChannelHandlerContext ctx, FullHttpRequest request) throws RocksDBException {
    L.debug("文件上传");
    HttpPostRequestDecoder decoder = new HttpPostRequestDecoder(factory, request);

    String fileId = null;
    String name = null;
    while (decoder.hasNext()) {
      InterfaceHttpData httpData = decoder.next();
      if (httpData != null) {
        L.debug("HttpData:{}", httpData.getName());
        try {
          switch (httpData.getHttpDataType()) {
            case Attribute:
              Attribute attribute = (Attribute) httpData;
              name = attribute.getValue();
              L.debug("文件名称:{}", name);
              break;
            case FileUpload:
              FileUpload fileUpload = (FileUpload) httpData;
              if (fileUpload.isCompleted()) {
                File dir = new File(FILE_DIR);
                FileUtils.forceMkdir(dir);
                fileId = System.nanoTime()
                    + "."
                    + FilenameUtils.getExtension(fileUpload.getFilename());
                File file = new File(dir, fileId);
                fileUpload.renameTo(file);
                L.debug("文件路径:{}", file.getAbsolutePath());
              }
              break;
          }
        } catch (IOException e) {
          L.catching(e);
        } finally {
          httpData.release();
        }
      }
    }

    if (fileId != null && name != null) {
      //自定义名称没有文件类型的补齐
      String extension = FilenameUtils.getExtension(fileId);
      if (!FilenameUtils.getExtension(name).equals(extension)) {
        name = name + "." + extension;
      }

      FILE_DB.put(fileId.getBytes(), name.getBytes());
    }

    if (fileId == null) {
      sendError(ctx, INTERNAL_SERVER_ERROR);
    } else {
      sendResponse(ctx, fileId);
    }
  }

  private void fileDownload(ChannelHandlerContext ctx, FullHttpRequest request, String uri)
      throws RocksDBException, IOException {
    L.debug("文件下载");

    //解析参数
    QueryStringDecoder queryStringDecoder = new QueryStringDecoder(uri);
    List<String> nameList = queryStringDecoder.parameters().get("name");

    //移除基础路径
    String fileId = uri.replaceFirst("/file/", "");
    //移除末尾参数
    if (fileId.lastIndexOf("?") != -1) {
      fileId = fileId.substring(0, fileId.lastIndexOf("?"));
    }

    //检查文件id
    Pattern pattern = Pattern.compile("^[0-9]{14,16}\\.[A-Za-z]{1,4}$");
    Matcher matcher = pattern.matcher(fileId);
    if (!matcher.matches()) {
      L.warn("文件id不正确:{}", fileId);
      sendError(ctx, FORBIDDEN);
      return;
    }

    //文件路径
    File file = new File(FILE_DIR, fileId);
    L.info("文件路径:{}", file.getAbsolutePath());

    //获取文件长度
    RandomAccessFile raf;
    long fileLength;
    try {
      raf = new RandomAccessFile(file, "r");
      fileLength = raf.length();
    } catch (IOException ignore) {
      L.warn("文件没有:{}", file.getAbsolutePath());
      sendError(ctx, NOT_FOUND);
      return;
    }

    //返回文件
    HttpResponse response = new DefaultHttpResponse(HTTP_1_1, OK);
    HttpUtil.setContentLength(response, fileLength);
    //文件类型
    MimetypesFileTypeMap mimeTypesMap = new MimetypesFileTypeMap();
    response.headers().set(HttpHeaderNames.CONTENT_TYPE, mimeTypesMap.getContentType(file.getPath()));
    response.headers().set(HttpHeaderNames.CONTENT_LENGTH, FileUtils.sizeOf(file));
    response.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_ORIGIN, "*");
    response.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_METHODS, "GET");
    response.headers().set(HttpHeaderNames.ACCESS_CONTROL_EXPOSE_HEADERS, "filename");
    // 时间
    SimpleDateFormat dateFormatter = new SimpleDateFormat(HTTP_DATE_FORMAT, Locale.US);
    dateFormatter.setTimeZone(TimeZone.getTimeZone(HTTP_DATE_GMT_TIMEZONE));
    // Date header
    Calendar time = new GregorianCalendar();
    response.headers().set(HttpHeaderNames.DATE, dateFormatter.format(time.getTime()));
    // Add cache headers
    time.add(Calendar.SECOND, HTTP_CACHE_SECONDS);
    response.headers().set(HttpHeaderNames.EXPIRES, dateFormatter.format(time.getTime()));
    response.headers().set(HttpHeaderNames.CACHE_CONTROL, "private, max-age=" + HTTP_CACHE_SECONDS);
    response.headers().set(
        HttpHeaderNames.LAST_MODIFIED, dateFormatter.format(new Date(file.lastModified()))
    );
    //长连接
    if (HttpUtil.isKeepAlive(request)) {
      response.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.KEEP_ALIVE);
    }
    //文件描述
    String name = file.getName();
    if (nameList != null) {
      name = nameList.get(0);

      //自定义名称没有文件类型的补齐
      String extension = FilenameUtils.getExtension(file.getName());
      if (!FilenameUtils.getExtension(name).equals(extension)) {
        name = name + "." + extension;
      }
    } else {
      byte[] nameBytes = FILE_DB.get(fileId.getBytes());
      if (nameBytes != null) {
        name = new String(nameBytes);
      }
    }
    name = URLEncoder.encode(name, "UTF-8");
    response.headers()
        .set(
            HttpHeaderNames.CONTENT_DISPOSITION,
            "attachment; filename=\"" + name + "\""
        );
    response.headers()
        .set("filename", name);

    // Write the initial line and the header.
    ctx.write(response);

    // Write the content.
    ChannelFuture sendFileFuture;
    ChannelFuture lastContentFuture;
    if (ctx.pipeline().get(SslHandler.class) == null) {
      sendFileFuture = ctx.write(
          new DefaultFileRegion(raf.getChannel(), 0, fileLength),
          ctx.newProgressivePromise()
      );
      // Write the end marker.
      lastContentFuture = ctx.writeAndFlush(LastHttpContent.EMPTY_LAST_CONTENT);
    } else {
      sendFileFuture = ctx.writeAndFlush(
          new HttpChunkedInput(new ChunkedFile(raf, 0, fileLength, 8192)),
          ctx.newProgressivePromise()
      );
      // HttpChunkedInput will write the end marker (LastHttpContent) for us.
      lastContentFuture = sendFileFuture;
    }
    sendFileFuture.addListener(new ChannelProgressiveFutureListener() {
      @Override
      public void operationProgressed(ChannelProgressiveFuture future, long progress, long total) {
        if (total < 0) { // total unknown
          L.debug(future.channel() + " Transfer progress: " + progress);
        } else {
          L.debug(future.channel() + " Transfer progress: " + progress + " / " + total);
        }
      }

      @Override
      public void operationComplete(ChannelProgressiveFuture future) {
        L.debug(future.channel() + " Transfer complete.");
      }
    });
    // Decide whether to close the connection or not.
    if (!HttpUtil.isKeepAlive(request)) {
      // Close the connection when the whole content is written out.
      lastContentFuture.addListener(ChannelFutureListener.CLOSE);
    }
  }

  @Override
  public void channelRead0(ChannelHandlerContext ctx, FullHttpRequest request)
      throws IOException, RocksDBException {

    //获取并转码uri
    String uri = request.uri();
    HttpMethod method = request.method();
    uri = URLDecoder.decode(uri, "UTF-8");
    L.info("频道读取HTTP-uri:{} method:{}", uri, method.name());

    //检查路径
    if (uri.startsWith("/file")) {
      L.debug("文件服务");
      if (method.equals(HttpMethod.POST)) {
        fileUpload(ctx, request);
      } else if (method.equals(HttpMethod.GET)) {
        fileDownload(ctx, request, uri);
      }
    } else {
      L.debug("无效uri:{}", uri);
      sendError(ctx, NOT_IMPLEMENTED);
    }
  }

  @Override
  public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
    L.catching(cause);
    ctx.close();
  }
}