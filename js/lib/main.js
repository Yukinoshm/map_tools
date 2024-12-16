function debounce(callback, delay) {
  let timerId;

  return function (...args) {
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}

/**变量 */
const navCtn = $(".left-nav-ctn");
let pageSwiper = null;
let part3ListTop = true;
let part3ListBot = false;
let movePart3List = false;
let currScrollIndex = 0;
let footShow = false;

// 全面战场新全局变量
window.viewChange = true; // 进攻方视角
window.occupy = false; // 占领模式
window.warLv = 0; // 阶段
window.isLvChange = false;
window.warSwiper = null; // 部署swiper
window.pervInitX = ""; // 上一次位移

// 导航相关
var navTypyList = $(".nav-type-list");
var regionList = $(".region-list");
var currLeftNav = 0;

// 地图相关
var visibleMarker = {};
var listIsAll = {
  0: false,
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
  6: false,
  7: false,
  8: false,
};
var visibleMarker2 = {
  0: {
    isAll: false,
    isInit: false,
    markers: {},
  },
  1: {
    isAll: false,
    isInit: false,
    markers: {},
  },
  2: {
    isAll: false,
    isInit: false,
    markers: {},
  },
  3: {
    isAll: false,
    isInit: false,
    markers: {},
  },
  4: {
    isAll: false,
    isInit: false,
    markers: {},
  },
  5: {
    isAll: false,
    isInit: false,
    markers: {},
  },
  6: {
    isAll: false,
    isInit: false,
    markers: {},
  },
  7: {
    isAll: false,
    isInit: false,
    markers: {},
  },
  8: {
    isAll: false,
    isInit: false,
    markers: {},
  },
};
var hoverMarker = {};
var clickMarker = {};
var ciLayer = null;
var typeListInit = false;

var mapScaleInfo = dabaInfo;

// var mapScaleInfo = gcInfo;
function getMapPos(posX, posY) {
  var x = Number(posX);
  var y = Number(posY);
  // x轴转换计算公式：世界轴 / 设计稿宽度/2
  // x轴倍率：81086.304688 / 4096 = 19.79646110546875
  // var xB = 81086.304688 / 4096
  // 81086.304688 / 128
  var xB2 = mapScaleInfo.width / 128;

  // y轴计算公式：世界轴 / 设计稿宽度/2
  // y轴倍率：80988.500000 / 4096 = 19.7725830078125
  // var yB = 80988.500000 / 4096 / -128
  var yB2 = mapScaleInfo.height / 128;

  // 世界中心轴x： 358155.687500； y： 750191.750000
  // return {x: 128 - (mapScaleInfo.centerX - x ) / xB2, y: -128 - (mapScaleInfo.centerY + y ) / yB2}
  // currLayer.name === 'map_gc'|| currLayer.name === 'map_pc'
  if (
    currLayer.name === "map_yc2" ||
    currLayer.name === "map_yc" ||
    mapScaleInfo.rotate
  ) {
    return {
      x: 128 - (mapScaleInfo.centerY + y) / yB2,
      y: -128 + (mapScaleInfo.centerX - x) / xB2,
    };
  } else {
    return {
      x: 128 - (mapScaleInfo.centerX - x) / xB2,
      y: -128 - (mapScaleInfo.centerY + y) / yB2,
    };
  }
  // return {x: 127, y: -68}
}

// 当前地图信息
// 全部icon
var allNavList = navList;
// 单个大类
var navTypeList = navListInfo;
// icon地图映射
var mapIcons = mapArticle;
var poiInfo = selectRegion;
var isRemove = false;

var poiList = [];

// 当前地图
var currLayer;

// 切换地图
var dom_changeMapBtn = $(".btn-change-map-ctn");
var dom_mapList = $(".map-list-ctn");
var isMoveMapList = false;
var currMap = "0";
var currLv = "0";
var currWarMap = "pc";
var currWarType = "pc";

// 是否坠机事件
var isZj = false;
// 全面战场模式
var isWar = false;
// 攻守方
var isAttack = true;

// 标点
var map;
var mapFolder = "0_4/";
var cacheMarker = [];
var cacheLocalMarker;
var currClickMarker;
var borderList = [];

function getColor() {
  return "filter: invert(34%) sepia(61%) saturate(2700%) hue-rotate(160deg) brightness(107%) contrast(107%);";
}

function refreshPlayer(item) {
  cacheLocalMarker?.remove();
  var popupHtml = `<div class="name">${item.name}</div>
                    <div class="address">
                        备注：<span>undefined</span>
                    </div>
                    <div class="open-text">
                        血量：<span>100</span>
                    </div>`;

    var pos = getMapPos(item.x, item.y);
    if (item.icon) {
      let rotate = 0;
      let svgColorStyle = getColor();
      var myIcon = L.divIcon({
        className: ` map-icon`,
        html: `<div class="map-icon-bg svg" style="${svgColorStyle}"><img src="../../images/localplayer.svg"/>
        </div>
        `,
        iconSize: [30, 30], //设置图标大小
        iconAnchor: [15, 15], //设置图标偏移
      });
      myIcon.name = item.name;

      cacheLocalMarker = L.marker([pos.y, pos.x], { icon: myIcon })
        .bindPopup(popupHtml)
        .addTo(map);
    }
}

function refreshMarker2(from, arr) {
  $.each(cacheMarker, function () {
    if (currClickMarker != this) {
      this.remove();
    }
  });

  isRemove = true;
  cacheMarker = [];

  $.each(arr, function (index, item) {
    var visible = false;
    var that = this;
    if (from === "filter" && visibleMarker[item.name]) visible = true;
    if (
      from === "filter" &&
      visibleMarker["出生点"] &&
      item.type === "revive"
    ) {
      visible = true;
    }
    if (from === "filter" && visibleMarker["首领"] && item.type === "Boss") {
      visible = true;
    }
    if (
      from === "filter" &&
      visibleMarker["行动接取站"] &&
      item.type === "move"
    ) {
      visible = true;
    }
    if (from === "filter" && visibleMarker["高价值"] && item.type === "move") {
      visible = true;
    }
    if (visible) {
      if (item["随机"]) {
        var popupHtml = `
                      <div class="name ${
                        (this.name === "[地狱黑鲨]雷斯—雷达站摧毁者" ||
                          this.name === "[地狱黑鲨]雷斯—酒店守卫者") &&
                        "max"
                      }">${this.name}<span> [${item["随机"]}]</span></div>
                      <div class="address">地点：<span>${
                        item["自定义区域"]
                      }</span></div>
                      <div class="open-text ${
                        !item["拾取条件"] || item["拾取条件"] === ""
                          ? "hide"
                          : ""
                      }">开启条件：<span>${item["拾取条件"]}</span></div>
                  `;
      } else if (item["自定义区域"]) {
        var popupHtml = `
                      <div class="name ${
                        (this.name === "[地狱黑鲨]雷斯—雷达站摧毁者" ||
                          this.name === "[地狱黑鲨]雷斯—酒店守卫者") &&
                        "max"
                      }">${this.name}</div>
                      <div class="address">地点：<span>${
                        item["自定义区域"]
                      }</span></div>
                      <div class="open-text ${
                        !item["拾取条件"] || item["拾取条件"] === ""
                          ? "hide"
                          : ""
                      }">开启条件：<span>${item["拾取条件"]}</span></div>
                  `;
      } else if (item["激活条件"]) {
        var popupHtml = `
                              <div class="name">${this.name}</div>
                           <div class="open-text war ${
                             !item["激活条件"] ||
                             item["激活条件"] === "" ||
                             item["激活条件"] === "-"
                               ? "hide"
                               : ""
                           }">激活条件：<span>${item["激活条件"]}</span></div>
                           `;
      } else {
        var popupHtml = `<div class="name">${this.name}</div>`;
      }

      var className = "";
      if (item?.type) {
        className = item.type;
      } else {
        className = "article";
      }
      var pos = getMapPos(this.x, this.y);
      var path =
        "https://game.gtimg.cn/images/dfm/cp/a20240729directory/img/xdaba/";
      var iconName = that.icon;

      if (this.icon) {
        var myIcon = L.divIcon({
          className: ` map-icon`,
          html: `<div class="map-icon-bg"><img src="${path + iconName}.png"/></div>`,
          iconSize: [30, 30], //设置图标大小
          iconAnchor: [15, 15], //设置图标偏移
        });
        myIcon.name = that.name;

        cacheMarker.push(
          L.marker([pos.y, pos.x], { icon: myIcon })
            .bindPopup(popupHtml)
            .addTo(map)
            .on({
              click: function () {
                currClickMarker?.setIcon(currClickMarker?.myIcon);
                this.isClick = true;
                let rotate = currWarMap === "qhz" ? 90 : 180;
                this.myIcon = myIcon;
                this.openPopup();
                this.setIcon(
                  L.divIcon({
                    className: ` map-icon click`,
                    html: `<div class="map-icon-bg" ><img src="${
                      path + iconName
                    }.png" style="${
                      that?.rotate
                        ? `transform:  rotate(${
                            Number(that?.rotate) + rotate
                          }deg)`
                        : ""
                    }"/></div>`,
                    iconSize: [30, 30], //设置图标大小
                    iconAnchor: [15, 15], //设置图标偏移
                  })
                );
                currClickMarker = this;
                $(this.getElement()).addClass("click");
              },
            })
        );
      }
    }
  });
  isRemove = false;
  console.log(cacheMarker.length);
}

function toggleVisible(type, index) {
  switch (type) {
    case "0_all":
    case "1_all":
    case "2_all":
    case "3_all":
    case "4_all":
    case "5_all":
      renderMarker();
      break;
    case "0_none":
    case "1_none":
    case "2_none":
    case "3_none":
    case "4_none":
    case "5_none":
      renderMarker();
      $(".map-icon").remove();
      console.log("删除", $(".map-icon").remove());
      break;
    case "none":
      $(".map-icon").remove();
      currClickMarker?.remove();
      renderMarker2();
      break;
    default:
      visibleMarker[type] = visibleMarker[type] ? false : true;
      break;
  }

  function renderMarker() {
    if (Number(currLeftNav) === 0) {
      for (var o in visibleMarker) {
        if (visibleMarker.hasOwnProperty(o)) {
          visibleMarker[o] = type.indexOf("all") > 0 ? true : false;
        }
      }
    } else {
      for (
        let index = 0;
        index < navTypeList[currLeftNav].typeList.length;
        index++
      ) {
        const element = navTypeList[currLeftNav].typeList[index];
        visibleMarker[element.name] = type.indexOf("all") > 0 ? true : false;
      }
    }
  }

  function renderMarker2() {
    for (var o in visibleMarker) {
      if (visibleMarker.hasOwnProperty(o)) {
        visibleMarker[o] = type.indexOf("all") > 0 ? true : false;
      }
    }
  }

  refreshMarker2("filter", mapIcons);
}

var init = function () {
  var mapWidth = mapScaleInfo.boundsW;
  var mapHeight = mapScaleInfo.boundsH;
  var mapOrigin = isWar ? L.latLng(0, -80) : L.latLng(0, 0);
  var pixelToLatLngRatio = -1;
  var southWest = mapOrigin; // 左上角
  var northEast = L.latLng(
    (mapHeight - 70) * pixelToLatLngRatio,
    mapWidth * pixelToLatLngRatio
  ); // 右下角
  var bounds = L.latLngBounds(southWest, northEast);

  map = L.map("MapContainer", {
    crs: L.CRS.Simple,
    attributionControl: false,
    zoomControl: false,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0,
    minZoom: mapScaleInfo.minZoom,
    maxZoom: 6,
    preferCanvas: true,
    detectRetina: true,
    smoothSensitivity: 1, // zoom speed. default is 1
    zoomSnap: 0.1,
    wheelDebounceTime: 10,
  }).setView([mapScaleInfo.initX, mapScaleInfo.initY], mapScaleInfo.initZoom);
  let control = new L.Control.Zoomslider();
  map.addControl(control);
  window.pervInitX = mapScaleInfo.initX;
  addLayer("map_db");
  // addLayer('map_gc');
  // currLayer = L.tileLayer(`https://game.gtimg.cn/images/dfm/cp/a20240729directory/img/map/{z}_{x}_{y}.jpg`, {
  //     minZoom: mapScaleInfo.minZoom,
  //     maxZoom: 5,
  //     noWrap: true,
  //     attribution: '© OpenStreetMap contributors',
  //     bounds: bounds
  // }).addTo(map);

  // selectRegion_cgxg

  map.on("click", function (e) {
    console.log("click", currClickMarker);
    if (currClickMarker) {
      currClickMarker.setIcon(currClickMarker.myIcon);
    }
    currClickMarker = null;
  });

  $(".leaflet-popup-pane").on("click", (e) => {
    console.log(e);
    console.log(currClickMarker);
    currClickMarker.closePopup();
    currClickMarker.setIcon(currClickMarker.myIcon);
  });
  // map.fitBounds(polyline.getBounds());
  initNav();
  bindEvent();
};

// 边界数组转换
function filterPos(str, char1, char2, i) {
  var index = str.indexOf(char1);
  var index2 = str.indexOf(char2, index + 1);
  // console.log(index, index2);

  if (index != -1 && index2 != -1) {
    return str.slice(index + 2, index2);
  }
  return str;
}

function addLayer(mapName) {
  // $('.leaflet-container').attr('class', `leaflet-container leaflet-touch leaflet-fade-anim leaflet-grab leaflet-touch-drag leaflet-touch-zoom map-${currMap}`)
  var mapWidth = window.occupy ? mapScaleInfo.boundsW_s : mapScaleInfo.boundsW;
  var mapHeight = window.occupy ? mapScaleInfo.boundsH_s : mapScaleInfo.boundsH;
  var mapOrigin = isWar ? L.latLng(0, -80) : L.latLng(0, 0);
  var pixelToLatLngRatio = -1;
  var southWest = mapOrigin; // 左上角
  var northEast = L.latLng(
    (mapHeight - 70) * pixelToLatLngRatio,
    mapWidth * pixelToLatLngRatio
  ); // 右下角

  var bounds = L.latLngBounds(southWest, northEast);
  currLayer = L.tileLayer(
    `https://game.gtimg.cn/images/dfm/cp/a20240729directory/img/${mapName}/{z}_{x}_{y}.jpg`,
    {
      minZoom: window.occupy ? mapScaleInfo.minZoom_s : mapScaleInfo.minZoom,
      maxZoom: 8,
      maxNativeZoom: 5,
      noWrap: false,
      attribution: "© OpenStreetMap contributors",
      bounds: bounds,
      errorTileUrl: `https://game.gtimg.cn/images/dfm/cp/a20240729directory/img/${mapName}/0_0_0.jpg`,
    }
  ).addTo(map);
  currLayer.name = mapName;
  map.setMaxBounds(bounds);
  map.options.minZoom = window.occupy
    ? mapScaleInfo.minZoom_s
    : mapScaleInfo.minZoom;

  if (mapName === "map_qhz" && currWarType === "mobile") {
    map.setView(
      [
        window.occupy ? mapScaleInfo.initX_mobile_s : mapScaleInfo.initX,
        window.occupy ? mapScaleInfo.initY_mobile_s : mapScaleInfo.initY,
      ],
      window.occupy ? mapScaleInfo.initZoom_s : mapScaleInfo.initZoom
    );
  } else {
    map.setView(
      [
        window.occupy ? mapScaleInfo.initX_s : mapScaleInfo.initX,
        window.occupy ? mapScaleInfo.initY_s : mapScaleInfo.initY,
      ],
      window.occupy ? mapScaleInfo.initZoom_s : mapScaleInfo.initZoom
    );
  }

  window.pervInitX = window.occupy ? mapScaleInfo.initX_s : mapScaleInfo.initX;

  $.each(poiList, function () {
    this.remove();
  });
  poiList = [];
  let html = "";
  poiInfo.forEach((item, index) => {
    if (item.name === "行政西楼" || item.name === "行政东楼") return;
    var myIcon = L.divIcon({
      className: ` map-region-name`,
      html: `<div class="map-region-name">${item.name}</div>`,
    });
    html += `<div class="region-item region-item-${index}" data-x="${item.x}" data-y="${item.y}">${item.name}</div>`;
    var pos = getMapPos(item.x, item.y);
    // regionList.append(`<div class="region-item region-item-${index}" data-x="${item.x}" data-y="${item.y}">${item.name}</div>`)

    poiList.push(L.marker([pos.y, pos.x], { icon: myIcon }).addTo(map));
  });
  // 锚点定位
  regionList.html(html);
  $(".region-item").on("click", function (e) {
    var x = $(e.target).attr("data-x");
    var y = $(e.target).attr("data-y");
    var pos = getMapPos(x, y);
    map.flyTo([pos.y, pos.x], 5);
  });
}

// 重置全选
function resetAll(type) {
  if (currLeftNav == 0) {
    console.log("全部");
    if (listIsAll[0]) {
      for (const key in listIsAll) {
        if (Object.hasOwnProperty.call(listIsAll, key)) {
          listIsAll[key] = false;
        }
      }
    } else {
      for (const key in listIsAll) {
        if (Object.hasOwnProperty.call(listIsAll, key)) {
          listIsAll[key] = type === "none" ? false : true;
        }
      }
    }
  } else if (type === "none") {
    for (const key in listIsAll) {
      if (Object.hasOwnProperty.call(listIsAll, key)) {
        listIsAll[key] = false;
      }
    }
  } else {
    listIsAll[currLeftNav] = listIsAll[currLeftNav] ? false : true;
  }

  if (
    listIsAll[1] &&
    listIsAll[2] &&
    listIsAll[3] &&
    listIsAll[4] &&
    listIsAll[5]
  ) {
    listIsAll[0] = true;
  } else if (
    !listIsAll[1] ||
    !listIsAll[2] ||
    !listIsAll[3] ||
    !listIsAll[4] ||
    !listIsAll[5]
  ) {
    listIsAll[0] = false;
  }
}

var initNav = function () {
  currLeftNav = 0;
  var navLeft = $(".nav-options");
  navLeft.html("");
  var navList;
  if (isWar) {
    navList = allNavList.typeList;
  } else {
    navList = allNavList;
  }

  allNavList.forEach(function (item, index) {
    navLeft.append(
      `<div class="nav-option-item nav-option-item-${index} ${
        currLeftNav === index ? "active" : ""
      }" style="${
        item.title === "行动接取站" ? "display: none" : ""
      }" data-index="${index}">${item.title}</div>`
    );
  });

  var navOptItem = $(".nav-option-item");
  // 选择类型
  navOptItem.on("click", function (e) {
    var index = $(e.target).attr("data-index");
    currLeftNav = index;
    navOptItem.removeClass("active");
    $(`.nav-option-item-${index}`).addClass("active");
    console.log($(e.target).attr("data-index"));
    // 渲染全部数据
    renderNavTypeList(navTypeList[index].typeList, index);

    if (listIsAll[currLeftNav]) {
      $(".btn-choose-all-icon").attr(
        "class",
        "img_all_open btn-choose-all-icon"
      );
    } else {
      $(".btn-choose-all-icon").attr(
        "class",
        "img_all_close btn-choose-all-icon"
      );
    }

    bindOptionEvent();
  });

  renderNavTypeList(navTypeList[0].typeList, 0);

  selectRegion.forEach(function (item, index) {
    regionList.append(
      `<div class="region-item region-item-${index}" data-x="${item.x}" data-y="${item.y}">${item.name}</div>`
    );
  });
};

var renderNavTypeList = function (list, navIndex = 0) {
  var html = "";
  if (list.length > 15) {
    html = '<div class="fgx top0">物资点</div>';
  }
  list.forEach(function (item, index) {
    // console.log(visibleMarker[item.name], item.name);
    if (item.name === "行动接取站" || item.name === "高价值接取站") return;
    if (
      item.name === "首领" ||
      item.name === "行动接取站" ||
      item.name === "固定弹药箱" ||
      item.name === "载具补给站"
    ) {
      html += `
            <div class="fgx ${
              list.length > 15 ||
              item.name === "固定弹药箱" ||
              item.name === "载具补给站"
                ? ""
                : "top0"
            }">${item.name}</div>
                <div class="nav-list-item nav-list-item-${index} nav-list-${
        item.icon
      } ${
        visibleMarker[item.name] ? "active" : ""
      }" data-index="${index}" data-icon="${item.icon}" data-name="${
        item.name
      }">
                <div class="wz-bg">
                    <div class="wz-icon img_${item.icon}"></div>
                    <div class="wz-num ${item.num === 1 ? "hides" : ""}">${
        item.num
      }</div>
                </div>
                <div class="wz-name">${item.name}</div>
            </div>`;
    } else {
      html += `
            <div class="nav-list-item nav-list-item-${index} nav-list-${
        item.icon
      } ${
        visibleMarker[item.name] ? "active" : ""
      }" data-index="${index}" data-icon="${item.icon}" data-name="${
        item.name
      }">
                <div class="wz-bg">
                    <div class="wz-icon img_${item.icon}"></div>
                    <div class="wz-num ${item.num === 1 ? "hides" : ""}">${
        item.num
      }</div>
                </div>
                <div class="wz-name">${item.name}</div>
            </div>`;
    }

    !typeListInit && (visibleMarker[item.name] = false);
  });
  navTypyList.html(html);
  typeListInit = true;
  visibleMarker2[navIndex].isInit = true;
};

function toastTips() {
  $(".m-toast").show();
  setTimeout(() => {
    $(".m-toast").hide();
  }, 800);
}

function fuzzyMatch(text, pattern) {
  // 将模糊词转换为正则表达式
  const regex = new RegExp(pattern.split("").join(".*"), "i");
  return regex.test(text);
}

var mapSelectCtn = $(".map-select");
var selectCtn = $(".select-ctn");
// 搜索
function selectmarker(name) {
  if (name === "") {
    mapSelectCtn.removeClass("show");
    return;
  }
  var markerList = [];
  var html = "";
  for (let index = 0; index < navTypeList[0].typeList.length; index++) {
    const element = navTypeList[0].typeList[index];
    console.log(element);
    fuzzyMatch(element.name, name) && markerList.push(element);
  }
  markerList.length &&
    markerList.forEach(function (item, index) {
      // console.log(visibleMarker[item.name], item.name);
      html += `
        <div class="nav-list-item nav-list-item-${index} nav-list-${
        item.icon
      } ${
        visibleMarker[item.name] ? "active" : ""
      }" data-index="${index}" data-icon="${item.icon}" data-name="${
        item.name
      }">
            <div class="wz-bg">
                <div class="wz-icon img_${item.icon}"></div>
                <div class="wz-num">${item.num}</div>
            </div>
            <div class="wz-name">${item.name}</div>
        </div>`;
    });
  // navTypyList.html(html)
  selectCtn.html(html);
  mapSelectCtn.addClass("show");

  bindOptionEvent();
}

function bindOptionEvent() {
  var NavListItem = $(".nav-list-item");

  // 选择标签
  NavListItem.on("click", function (e) {
    var index = $(e.target).attr("data-index");
    var name = $(e.target).attr("data-name");
    var icon = $(e.target).attr("data-icon");
    console.log("index", $(e.target).attr("data-icon"));

    !visibleMarker[name]
      ? $(this).addClass("active")
      : $(this).removeClass("active");
    toggleVisible(name, currLeftNav);

    let chooseNum = $(".nav-type-list").find(".active").length;

    if (chooseNum === navTypeList[currLeftNav].typeList.length) {
      $(".btn-choose-all-icon").attr(
        "class",
        "img_all_open btn-choose-all-icon"
      );
    } else {
      if (listIsAll[currLeftNav]) {
        listIsAll[currLeftNav] = false;
        listIsAll[0] = false;
        $(".btn-choose-all-icon").attr(
          "class",
          "img_all_close btn-choose-all-icon"
        );
      } else {
        $(".btn-choose-all-icon").attr(
          "class",
          "img_all_close btn-choose-all-icon"
        );
      }
    }
  });
}

// 事件
var bindEvent = function () {
  // 导航栏状态
  var navState = true;
  var navCtn = $(".nav-ctn");
  var navOptItem = $(".nav-option-item");
  var btnNavState = $(".btn-nav-state");

  // 搜索地区
  $(".region-item").on("click", function (e) {
    var x = $(e.target).attr("data-x");
    var y = $(e.target).attr("data-y");
    var pos = getMapPos(x, y);
    map.flyTo([pos.y, pos.x], 5);
  });

  // 全选
  $(".choose-all").on("click", function () {
    // resetNav();
    resetAll();

    if (listIsAll[currLeftNav]) {
      toggleVisible(`${currLeftNav}_all`, currLeftNav);
      $(".btn-choose-all-icon").attr(
        "class",
        "img_all_open btn-choose-all-icon"
      );
    } else {
      toggleVisible(`${currLeftNav}_none`, currLeftNav);
      $(".btn-choose-all-icon").attr(
        "class",
        "img_all_close btn-choose-all-icon"
      );
    }
    renderNavTypeList(navTypeList[currLeftNav].typeList, currLeftNav);
    bindOptionEvent();
  });

  // 重置
  $(".reset-choose").on("click", function () {
    resetAll("none");
    toggleVisible(`none`, currLeftNav);
    $(".btn-choose-all-icon").attr(
      "class",
      "img_all_close btn-choose-all-icon"
    );
    renderNavTypeList(navTypeList[currLeftNav].typeList, currLeftNav);
    bindOptionEvent();
  });

  // 选择类型
  navOptItem.on("click", function (e) {
    var index = $(e.target).attr("data-index");
    currLeftNav = index;
    navOptItem.removeClass("active");
    $(`.nav-option-item-${index}`).addClass("active");
    console.log($(e.target).attr("data-index"));
    renderNavTypeList(navTypeList[index].typeList, index);

    if (listIsAll[currLeftNav]) {
      $(".btn-choose-all-icon").attr(
        "class",
        "img_all_open btn-choose-all-icon"
      );
    } else {
      $(".btn-choose-all-icon").attr(
        "class",
        "img_all_close btn-choose-all-icon"
      );
    }

    bindOptionEvent();
  });

  bindOptionEvent();

  // 打开关闭导航
  btnNavState.on("click", function () {
    navState = !navState;
    if (navState) {
      navCtn.attr("class", "open img_nav_bg nav-ctn");
    } else {
      navCtn.attr("class", "close img_nav_bg nav-ctn");
    }
  });

  // 切换地图移入事件
  dom_changeMapBtn.on("mouseenter", function () {
    dom_mapList.css("height", "1.85rem");
    dom_changeMapBtn.css("height", "1rem");
    dom_changeMapBtn.addClass("hover");
  });

  dom_changeMapBtn.on("mouseleave", function () {
    // dom_mapList.css('height', '0px');
    if (!isMoveMapList) {
      dom_mapList.css("height", "0px");
      dom_mapList.css("width", "1rem");
      dom_changeMapBtn.css("height", "0.3rem");
      dom_changeMapBtn.removeClass("hover");
      dom_mapList.attr("class", `map-list-ctn hover_0`);
    }
  });

  let currWarMap_s;
  dom_mapList.on("mouseover", function (e) {
    var index = $(e.target).attr("data-index");
    var warMap = $(e.target).attr("data-map");
    console.log(index, warMap);

    if (index) {
      currMap = index;
      currWarMap_s = warMap;
      // currWarMap = warMap
      dom_mapList.attr("class", `map-list-ctn hover_${index}`);
    }

    if (warMap) {
      mapItem.removeClass("action");
      // currWarMap = warMap;
      currWarMap_s = warMap;
      $(e.target).addClass("action");
    }
    dom_mapList.css("width", "4rem");
    isMoveMapList = true;
  });

  dom_mapList.on("mouseleave", function () {
    dom_mapList.css("height", "0px");
    dom_mapList.css("width", "1rem");
    dom_changeMapBtn.css("height", "0.3rem");
    dom_changeMapBtn.removeClass("hover");
    dom_mapList.attr("class", `map-list-ctn hover_0`);
    isMoveMapList = false;

    currWarMap_s = currWarMap;
    console.log("currWarMap_s", currWarMap_s);
    $(".map-lv-item").removeClass("action");
    mapItem.removeClass("action");
  });

  // 切换难度
  $(".map-lv-item").on("mouseover", function (e) {
    var lv = $(e.target).attr("data-lv");
    var type = $(e.target).attr("data-type");
    if (lv && Number(lv) > 0) {
      console.log(lv);
      $(".btn-random").attr("class").indexOf("top") === -1 &&
        $(".btn-random").addClass("top");
      $(".btn-type-change").attr("class").indexOf("top") === -1 &&
        $(".btn-type-change").addClass("top");
    } else {
      $(".btn-random").removeClass("top");
      $(".btn-type-change").removeClass("top");
    }

    if (type) {
      $(".map-lv-item").removeClass("action");
      currWarMap = currWarMap_s;
      currWarType = type;
      $(e.target).addClass("action");
    }
  });

  // 选择难度等级
  $(".map-lv-item").on("click", function (e) {
    var lv = $(e.target).attr("data-lv");
    var type = $(e.target).attr("data-type");

    if (isZj && currMap == 1) {
      changeMapLv(currMap + lv + "_s");
    } else {
      changeMapLv(currMap + lv);
    }

    if (currMap + currLv !== currMap + lv) {
      if (
        window.pervInitX === window.occupy
          ? mapScaleInfo.initX_s
          : mapScaleInfo.initX
      )
        return;
      map.flyTo(
        [
          window.occupy ? mapScaleInfo.initX_s : mapScaleInfo.initX,
          window.occupy ? mapScaleInfo.initY_s : mapScaleInfo.initY,
        ],
        window.occupy ? mapScaleInfo.initZoom_s : mapScaleInfo.initZoom
      );
      window.pervInitX = window.occupy
        ? mapScaleInfo.initX_s
        : mapScaleInfo.initX;
    }
    currLv = lv;
    currWarType = type;

    dom_mapList.css("height", "0px");
    dom_mapList.css("width", "1rem");
    dom_changeMapBtn.css("height", "0.3rem");
    dom_changeMapBtn.removeClass("hover");
    dom_mapList.attr("class", `map-list-ctn hover_0`);
    isMoveMapList = false;
    // $('.btn-random').removeClass('open')
    if (!isWar) {
      resetAll("none");
      toggleVisible(`none`, currLeftNav);
    }
  });

  // 坠机事件
  $(".btn-random").on("click", function () {
    isZj = !isZj;
    isZj
      ? $(".btn-random").addClass("open")
      : $(".btn-random").removeClass("open");
    if (isZj) {
      if ($(".btn-random").attr("class").indexOf("top") === -1) {
        changeMapLv("10_s");
        if (currMap + currLv !== "10_s") {
          map.flyTo(
            [mapScaleInfo.initX, mapScaleInfo.initY],
            mapScaleInfo.initZoom
          );
        }
        currLv = "0";
      } else {
        changeMapLv("11_s");
        if (currMap + currLv !== "11_s") {
          map.flyTo(
            [mapScaleInfo.initX, mapScaleInfo.initY],
            mapScaleInfo.initZoom
          );
        }
        currLv = "1";
      }
    } else {
      if ($(".btn-random").attr("class").indexOf("top") === -1) {
        changeMapLv("10");
        if (currMap + currLv !== "10") {
          // map.setView([mapScaleInfo.initX, mapScaleInfo.initY], mapScaleInfo.initZoom)
          map.flyTo(
            [mapScaleInfo.initX, mapScaleInfo.initY],
            mapScaleInfo.initZoom
          );
        }
        currLv = "0";
      } else {
        changeMapLv("11");
        if (currMap + currLv !== "11") {
          map.flyTo(
            [mapScaleInfo.initX, mapScaleInfo.initY],
            mapScaleInfo.initZoom
          );
        }
        currLv = "1";
      }
    }
    resetAll("none");
    toggleVisible(`none`, currLeftNav);
  });

  // 打开日志
  $(".btn-log").on("click", function () {
    $(".log-pop").fadeIn();
    // toastTips();
  });

  // 关闭日志弹窗
  $(".btn-close-pop").on("click", function () {
    $(".log-pop").fadeOut();
  });

  // 搜索
  $(".select-iput").on(
    "input",
    debounce(function (e) {
      var name = $(e.target).val();
      selectmarker(name);
    }, 500)
  );

  // 关闭搜索
  $(".btn-close-select").on("click", function () {
    $(".select-iput").val("");
    $(".map-select").removeClass("show");
    renderNavTypeList(navTypeList[currLeftNav].typeList, currLeftNav);
    bindOptionEvent();
    PTTSendClick && PTTSendClick("btn", "close", "关闭弹窗");
  });

  navTypyList.on("scroll", function (e) {
    var aScrollHeight =
      document.querySelector(".nav-type-list").scrollHeight -
      document.querySelector(".nav-type-list").clientHeight;
    if (
      aScrollHeight - navTypyList.scrollTop() >= -10 &&
      aScrollHeight - navTypyList.scrollTop() <= 10
    ) {
      navTypyList.addClass("bot");
    } else {
      navTypyList.removeClass("bot");
    }
  });

  // 切换模式 —— 当前未使用，仅烽火地带模式
  $(".map-change-text").on("click", () => {
    if (!isWar) return;
    isWar = false;

    window.occupy = false;
    window.viewChange = true;
    $(".btn-view-change").addClass("g");
    $(".btn-view-change").removeClass("f");
    $(".nav-option-ctn").addClass("g");
    $(".nav-option-ctn").removeClass("f");
    $(".war-lv-change-list").attr("class", "war-lv-change-list g");

    dom_changeMapBtn.removeClass("war");
    $(".btn-war-change").removeClass("war");
    $(".btn-view-change").attr("class", "btn-view-change");
    changeMapLv("00");
    warRemove();
    currMap = "0";
    currLv = "0";
    initNav();
    bindOptionEvent();
    $(".war-lv-change-ctn").removeClass("show");
    $(".select-region-ctn").css("display", "block");
  });
};

// 地图难度切换
function changeMapLv(type) {
  mapScaleInfo = dabaInfo;
  allNavList = navList;
  navTypeList = navListInfo;
  mapIcons = mapArticle;
  poiInfo = selectRegion;
  switch (type) {
    case "00":
      $(".curr-map-name").html(
        '零号大坝 <span class="map-lv"> ( 普通 )</span>'
      );
      currLayer.name !== "map_db" && addLayer("map_db");
      break;
    case "01":
      $(".curr-map-name").html(
        '零号大坝 <span class="map-lv"> ( 机密 )</span>'
      );
      currLayer.name !== "map_db" && addLayer("map_db");
      break;
    case "10":
      $(".curr-map-name").html(
        '长弓溪谷 <span class="map-lv"> ( 普通 )</span>'
      );
      map.removeLayer(currLayer);
      currLayer.name !== "map_yc" && addLayer("map_yc");
      map.addLayer(currLayer);
      break;
    case "10_s":
      $(".curr-map-name").html(
        '长弓溪谷 <span class="map-lv"> ( 普通｜坠机事件 )</span>'
      );
      map.removeLayer(currLayer);
      currLayer.name !== "map_yc2" && addLayer("map_yc2");
      map.addLayer(currLayer);
      break;
    case "11":
      $(".curr-map-name").html(
        '长弓溪谷 <span class="map-lv"> ( 机密 )</span>'
      );
      map.removeLayer(currLayer);
      currLayer.name !== "map_yc" && addLayer("map_yc");
      map.addLayer(currLayer);
      break;
    case "11_s":
      $(".curr-map-name").html(
        '长弓溪谷 <span class="map-lv"> ( 机密｜坠机事件 )</span>'
      );
      map.removeLayer(currLayer);
      currLayer.name !== "map_yc2" && addLayer("map_yc2");
      map.addLayer(currLayer);
      break;
    case "21":
      $(".curr-map-name").html(
        '航天基地 <span class="map-lv"> ( 机密 )</span>'
      );
      map.removeLayer(currLayer);
      currLayer.name !== "map_htjd" && addLayer("map_htjd");
      map.addLayer(currLayer);
      break;
    case "22":
      $(".curr-map-name").html(
        '航天基地 <span class="map-lv"> ( 绝密 )</span>'
      );
      map.removeLayer(currLayer);
      currLayer.name !== "map_htjd" && addLayer("map_htjd");
      map.addLayer(currLayer);
      break;
    case "30":
      $(".curr-map-name").html('巴克什 <span class="map-lv"> ( 普通 )</span>');
      map.removeLayer(currLayer);
      currLayer.name !== "map_bks" && addLayer("map_bks2");
      map.addLayer(currLayer);
      break;
    case "31":
      $(".curr-map-name").html('巴克什 <span class="map-lv"> ( 机密 )</span>');
      map.removeLayer(currLayer);
      currLayer.name !== "map_bks" && addLayer("map_bks2");
      map.addLayer(currLayer);
      break;
    default:
      toastTips();
      break;
  }
  typeListInit = false;
  resetAll("none");
  if (listIsAll[currLeftNav]) {
    toggleVisible(`${currLeftNav}_all`, currLeftNav);
    $(".btn-choose-all-icon").attr("class", "img_all_open btn-choose-all-icon");
  } else {
    toggleVisible(`${currLeftNav}_none`, currLeftNav);
    $(".btn-choose-all-icon").attr(
      "class",
      "img_all_close btn-choose-all-icon"
    );
  }
  renderNavTypeList(navTypeList[currLeftNav].typeList, currLeftNav);
  bindOptionEvent();
}

window.addEventListener("load", () => {
  init();
});
