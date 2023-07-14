var container = document.getElementById("map"); //지도를 담을 영역의 DOM 레퍼런스
var options = {
  //지도를 생성할 때 필요한 기본 옵션
  center: new kakao.maps.LatLng(37.54, 126.96), //지도의 중심좌표
  level: 8, //지도의 확대, 축소 정도
};

var map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴

// 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성
var zoomControl = new kakao.maps.ZoomControl();
map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

async function getDataSet(category) {
  let qs = category;
  if (!qs) {
    qs = "";
  }

  const dataSet = await axios({
    method: "get", // http method
    url: `https://www.youtubetasty.store/restaurants?category=${qs}`,
    headers: {}, // packet header
    data: {}, // packet body
  });
  return dataSet.data.result;
}

getDataSet();

// 주소-좌표 변환 객체
var geocoder = new kakao.maps.services.Geocoder();

// 주소-좌표 변환 함수
function getCoordsByAddress(address) {
  return new Promise((resolve, reject) => {
    // 주소로 좌표 검색
    geocoder.addressSearch(address, function (result, status) {
      // 정상적으로 검색 완료 시 or 오류발생한 주소 반환
      if (status === kakao.maps.services.Status.OK) {
        var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        resolve(coords);
        return;
      } else {
        console.error("주소 변환 오류:", address);
        reject(new Error("getCoordsByAddress Error: not Vaild Address"));
      }
    });
  });
}

function getContent(data) {
  // 유튜브 섬네일 id 가져오기(shorts는 안됨)
  let replaceUrl = data.videoUrl;
  let finUrl = "";
  replaceUrl = replaceUrl.replace("https://youtu.be/", "");
  replaceUrl = replaceUrl.replace("https://www.youtube.com/embed/", "");
  replaceUrl = replaceUrl.replace("https://www.youtube.com/watch?v=", "");
  finUrl = replaceUrl.split("&")[0];

  // 인포윈도우 가공하기
  return `
  <div class="infowindow">
      <div class="infowindow-img-container">
        <img
          src="https://img.youtube.com/vi/${finUrl}/mqdefault.jpg"
          class="infowindow-img"
        />
      </div>
      <div class="infowindow-body">
        <h5 class="infowindow-title">${data.title}</h5>
        <p class="infowindow-address">${data.address}</p>
        <a href="${data.videoUrl}" class="infowindow-btn" target="_blank">유튜브 영상 보기</a>
      </div>
    </div>
  `;
}

async function setMap(dataSet) {
  markerArray = [];
  infowindowArray = [];
  overlayArray = [];

  // 커스텀 마커 이미지
  var imageSrc = "./images/custom_marker.png";
  var imageSize = new kakao.maps.Size(55, 55);
  var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

  for (var i = 0; i < dataSet.length; i++) {
    // 마커를 생성합니다
    let coords = await getCoordsByAddress(dataSet[i].address);
    var marker = new kakao.maps.Marker({
      map: map, // 마커를 표시할 지도
      position: coords, // 마커를 표시할 위치
      image: markerImage, // 커스텀 마커 이미지
    });

    markerArray.push(marker);

    // 커스텀 오버레이로 식당 이름을 마커에 표시
    var overlaycontent = `<div class="customoverlay">${dataSet[i].title}</div>`;

    // 커스텀 오버레이가 표시될 위치
    var overlayposition = new kakao.maps.LatLng(
      coords.getLat(),
      coords.getLng()
    );

    // 커스텀 오버레이를 생성
    var customOverlay = new kakao.maps.CustomOverlay({
      map: map,
      position: overlayposition,
      content: overlaycontent,
      yAnchor: 1,
    });

    overlayArray.push(customOverlay);

    // 마커에 표시할 인포윈도우를 생성
    var infowindow = new kakao.maps.InfoWindow({
      content: getContent(dataSet[i]), // 인포윈도우에 표시할 내용
    });

    infowindowArray.push(infowindow);

    // 마커에 mouseover 이벤트와 mouseout 이벤트를 등록
    // 이벤트 리스너로는 클로저를 만들어 등록
    kakao.maps.event.addListener(
      marker,
      "click",
      makeOverListener(map, marker, infowindow, customOverlay, coords)
    );
    kakao.maps.event.addListener(map, "click", makeOutListener(infowindow));
  }
}

// 인포윈도우를 표시하는 클로저를 만드는 함수
function makeOverListener(map, marker, infowindow, coords) {
  return function () {
    // 1. 클릭시 다른 인포윈도우 닫기
    closeInfoWindow();
    infowindow.open(map, marker);
    // 2. 클릭한 곳으로 지도 중심 옮기기
    map.panTo(coords);
  };
}

let infowindowArray = [];
function closeInfoWindow() {
  for (let infowindow of infowindowArray) {
    infowindow.close();
  }
}

// 인포윈도우를 닫는 클로저를 만드는 함수
function makeOutListener(infowindow) {
  return function () {
    infowindow.close();
  };
}
// 커스텀오버레이를 닫는 클로저를 만드는 함수
function closeCustomOverlay() {
  for (let overlay of overlayArray) {
    overlay.setMap(null);
  }
  overlayArray = [];
}

// 카테고리 분류
const categoryMap = {
  bread: "빵지순례 필수코스",
  coding: "코딩하기 좋은 카페",
  chicken: "순삭 치킨 맛집",
  ttek: "떡볶이 최강자들",
  spicy: "최고의 마라맛집",
  wine: "분위기 좋은 내추럴와인바",
  kukbob: "밥은 먹고 다니냐? 국밥",
  stake: "맛성비 스테이크",
};

const categoryList = document.querySelector(".category-list");
categoryList.addEventListener("click", categoryHandler);

async function categoryHandler(event) {
  const categoryId = event.target.id;
  const category = categoryMap[categoryId];

  try {
    // 데이터 분류
    let categorizedDataSet = await getDataSet(category);

    // 기존 마커 삭제
    closeMarker();

    // 기존 인포윈도우 닫기
    closeInfoWindow();

    // 기존 커스텀오버레이 삭제
    closeCustomOverlay();

    // 카테고리화된 데이터를 맵에 표시
    setMap(categorizedDataSet);
  } catch (error) {
    console.error(error);
  }
}

// 마커 클로저 함수
let markerArray = [];
function closeMarker() {
  for (marker of markerArray) {
    marker.setMap(null);
  }
}

// 맵 디폴트 환경설정
async function setting() {
  try {
    const dataSet = await getDataSet();
    setMap(dataSet);
  } catch (error) {
    console.error(error);
  }
}

setting();
