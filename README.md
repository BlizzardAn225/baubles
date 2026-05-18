这里面的是兴趣使然写的代码，未来可能会有更多奇思妙想。代码有不足我会尽量不足，还请多多包含。

个人水平有限，没法搞出大的操作，敬请原谅。

---
## PNG头像上传脚本说明
原版PNG上传脚本对所有页面起作用，但可能会引发不可预知的问题，例如我今天在付款的时候，怎么刷新页面，付款码都是空白，关掉脚本后正常，遂修改。现在1.2版本只会对网址包含 `account`、`myaccount` 和 `profile` 的页面起作用，若某网站支持带透明通道的头像，但使用1.2版本后上传、网站加载出的头像不是透明的，请使用原先的版本（1.1在时间上距离1.2太近，直接覆盖）。

如何判断某网站能使用带透明通道的头像？直接把网站上显示的头像图片拖到桌面，或者在开发者工具中找到该图片，若是png/avif/webp等支持透明通道的格式，则该网站能够使用透明头像，若是jpg/jpeg则不可。

>你知道吗？Google账户是原生支持使用动图作为头像的，这是我今天在测试一个上传动图作头像的脚本时发现的（不过几乎都没成功）。

---
## 重要：此文件功能已被 `微软账户透明头像-1.0.user.js` 替代
## ProfileXS_AMC_account.microsoft.com.js用法：
- 访问 `account.microsoft.com/profile?`（一定要是**个人档案页面**），请勿使用代理，要不然加载半天不知道是网络问题还是操作有误）。
- F12启用本地覆盖（下面都在开发人员工具页面进行）。
- 转到源代码-工作区，在电脑上你认为方便的地方新建文件夹，重命名为 `top` 后（比如电脑桌面），工作区-手动添加文件夹（若原先已经存在，则需要先删除原本存在的）。
- 转到源代码-页面 `top/account.microsoft.com/bundles/scripts/` ，找到文件 `ProfileXS_AMC_UX...`，右键，选择“**替代内容**”，选择文件夹就选择刚刚创建的 `top` 文件夹。
- 在 `top` 文件夹里找到这个文件，复制文件名后删除，替换为我上传的文件，并将其重命名为刚才的名字，**去掉.js后缀**。
- 重新加载网页，时间可能会比较长，耐心等待。
- 现在可以把档案头像替换为透明头像，注意，当上传新的图片后，若想更换其他图片，需要先保存，再删除图片（编辑窗口不会清空选择的图片，直接更换图片将导致重叠）。

原理：
- 将所有 `iamge/jpeg` 修改为 `image/png` （允许上传png图片）；
- 拦截所有含 `fillRect` 字段、绝大部分含 `fillStyle` 字段（这俩是阻止给图片的透明区域填充底色）；
- 删除所有与 `arc(128, 128, 125, 0, 2 * Math.PI, !0)` 相关字段（阻止编辑面板创建一个圆，要不然头像会带一个很糊的圆，很丑）；
- 删除了几个含 `canvas` 字段（阻止画板本身填充底色），但是我忘了具体删哪些了。
  
>关于微软工作账户 `myworkaccount.microsoft.com` 和 `myaccount.microsoft.com` （比如E5账户），我成功实现了，但是Word、PPT等office软件电脑端在加载头像时，会自动重绘（加个黑底），导致不仅没什么用还很难看，在手机端才会正常。

---
## `微软账户透明头像-1.0.user.js` 说明
对 `account.microsoft.com/profile?` 网页源代码 `ProfileXS_AMC_UX...` 的以下代码进行了拦截和替换.

修改1：
```
{
    var t = r.current;
    if (t && a.current) {
    var n = t.getContext("2d");
    if (!n)
        return void B("UNSUPPORTED_BROWSER");
    var o = window.getComputedStyle(t);
    n.fillStyle = o.backgroundColor || "#ffffff",
    n.fillRect(0, 0, 1, 1);
    var s = n.getImageData(0, 0, 1, 1).data
      , l = "rgba(".concat(s[0], ", ").concat(s[1], ", ").concat(s[2], ", 0.6)")
      , c = "rgba(".concat(s[0], ", ").concat(s[1], ", ").concat(s[2], ", 1)")
      , u = (0,
    e6.X)({
        text: e.personDisplayName
    });
    "" === e.dataUrl ? (n.fillStyle = u,
    a.current.style.display = "flex") : (n.fillStyle = e.customBackgroundColor || f,
    a.current.style.display = "none"),
    n.fillRect(0, 0, p, p),
    e.image && b(n, p, e.imageRotationAngle, e.orientation, e.image, function(t, n) {
        return t.drawImage(n, e.xpos, e.ypos, e.naturalWidth * e.absoluteScale / e.maximumScale, e.naturalHeight * e.absoluteScale / e.maximumScale)
    }),
    null == O || O(t),
    "Circle" === e.imageCropShape && (n.save(),
    n.beginPath(),
    n.rect(0, 0, p, p),
    n.arc(p / 2, p / 2, m, 0, 2 * Math.PI, !0),
    n.clip(),
    n.fillStyle = l,
    n.fillRect(0, 0, p, p),
    n.restore(),
    n.save(),
    n.beginPath(),
    n.arc(p / 2, p / 2, m + 1, 0, 2 * Math.PI, !0),
    n.lineWidth = 2,
    n.strokeStyle = c,
    n.stroke(),
    n.restore(),
    n.save(),
    n.beginPath(),
    n.lineWidth = 4,
    n.fillStyle = v,
    n.strokeStyle = v,
    n.arc(p / 2, p / 2, m, -Math.PI / 2, 2 * e.progress * Math.PI - Math.PI / 2, !1),
    1 === e.progress && n.fill(),
    n.stroke(),
    n.restore())
}
```
修改为
```
{
    var t = r.current;
    if (t && a.current) {
        var n = t.getContext("2d");
        if (!n)
            return void B("UNSUPPORTED_BROWSER");
        var o = window.getComputedStyle(t);
        var s = n.getImageData(0, 0, 1, 1).data
          , l = "rgba(".concat(s[0], ", ").concat(s[1], ", ").concat(s[2], ", 0.6)")
          , c = "rgba(".concat(s[0], ", ").concat(s[1], ", ").concat(s[2], ", 1)")
          , u = (0,
        e6.X)({
            text: e.personDisplayName
        });
        
        // 修改：只控制显示隐藏，不设置背景色
        "" === e.dataUrl ? (
            a.current.style.display = "flex"
        ) : (
            a.current.style.display = "none"
        ),
        
        // 绘制图片
        e.image && b(n, p, e.imageRotationAngle, e.orientation, e.image, function(t, n) {
            return t.drawImage(n, e.xpos, e.ypos, e.naturalWidth * e.absoluteScale / e.maximumScale, e.naturalHeight * e.absoluteScale / e.maximumScale)
        }),
        
        null == O || O(t)

    }
}
```

修改2：
```
t.getImageDataUrlFromCanvas = function(e) {
    if (!t.props.image)
        return "";
    e || (e = h);
    var n = document.createElement("canvas")
      , r = t.props.naturalMin / t.props.absoluteScale;
    n.width = r,
    n.height = r;
    var o = n.getContext("2d");
    if (!o)
        return t.props.onError("UNSUPPORTED_BROWSER"),
        "";
    o.fillStyle = t.props.customBackgroundColor || f,
    o.fillRect(0, 0, n.width, n.height),
    t.props.image && b(o, n.width, t.props.imageRotationAngle, t.props.orientation, t.props.image, function(e, r) {
        return o.drawImage(r, t.props.xpos * n.width / p, t.props.ypos * n.height / p, t.props.naturalWidth, t.props.naturalHeight)
    });
    for (var a = 1; n.width * a / 4 >= e; )
        a /= 2,
        o.drawImage(n, 0, 0, n.width * a, n.height * a);
    var s = document.createElement("canvas")
      , l = Math.min(t.props.naturalMin / t.props.absoluteScale, e);
    s.width = l,
    s.height = l;
    var c = s.getContext("2d");
    return c ? (c.drawImage(n, 0, 0, n.width * a, n.width * a, 0, 0, l, l),
    u(s, t.props.isComponentInline)) : (t.props.onError("UNSUPPORTED_BROWSER"),
    "")
}
```
修改为
```
t.getImageDataUrlFromCanvas = function(e) {
    if (!t.props.image)
        return "";
    e || (e = h);
    var n = document.createElement("canvas")
      , r = t.props.naturalMin / t.props.absoluteScale;
    n.width = r,
    n.height = r;
    var o = n.getContext("2d");
    if (!o)
        return t.props.onError("UNSUPPORTED_BROWSER"),
        "";

    t.props.image && b(o, n.width, t.props.imageRotationAngle, t.props.orientation, t.props.image, function(e, r) {
        return o.drawImage(r, t.props.xpos * n.width / p, t.props.ypos * n.height / p, t.props.naturalWidth, t.props.naturalHeight)
    });

    for (var a = 1; n.width * a / 4 >= e; )
        a /= 2,
        o.drawImage(n, 0, 0, n.width * a, n.height * a);
    
    var s = document.createElement("canvas")
      , l = Math.min(t.props.naturalMin / t.props.absoluteScale, e);
    s.width = l,
    s.height = l;
    var c = s.getContext("2d");
    return c ? (c.drawImage(n, 0, 0, n.width * a, n.width * a, 0, 0, l, l),
    u(s, t.props.isComponentInline)) : (t.props.onError("UNSUPPORTED_BROWSER"),
    "")
}
```

修改3：
```
CVSolidElement.prototype.renderInnerContent = function() {
    var e = this.canvasContext;
    e.fillStyle = this.data.sc,
    e.fillRect(0, 0, this.data.sw, this.data.sh)
}
```
修改为
```
CVSolidElement.prototype.renderInnerContent = function() {
    var e = this.canvasContext;
}
```
>微软工作账户 `myworkaccount.microsoft.com` 和 `myaccount.microsoft.com` 修改透明头像的应用场景较少，只会在这两个网页上、office软件中见到，而一旦使用透明头像，office会将其自动重绘为黑底jpeg、旧版页面自动重绘为白底头像、新版页面的头像展示区域默认带个橙黄底，导致修改没什么意义，故不作改动，若有兴趣，可参照以上内容自行替换 `网站域名/bundle/main.xxxxxxxx.js` 中对应代码。对于代码没有可读性的问题，可以在浏览器开发者工具中，打开这个js页面（你点了这个文件就会自动打开了），然后随便输入什么，撤销、保存即可。
