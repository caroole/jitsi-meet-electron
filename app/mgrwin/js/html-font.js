/* 
* @Author: anchen
* @Date:   2015-10-27 11:19:52
* @Last Modified by:   anchen
* @Last Modified time: 2015-10-27 14:54:29
*/

//计算html字体大小
var calculate_size = function () {
    var BASE_FONT_SIZE = 100;

    var docEl = document.documentElement,
  clientWidth = docEl.clientWidth;
  if (!clientWidth) return;
  docEl.style.fontSize = BASE_FONT_SIZE * (clientWidth / 750) + 'px';
};

// Abort if browser does not support addEventListener
if (document.addEventListener) {
    var resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize';
    window.addEventListener(resizeEvt, calculate_size, false);
    document.addEventListener('DOMContentLoaded', calculate_size, false);
    calculate_size();
}
//计算html字体大小结束