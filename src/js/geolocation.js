/* eslint-disable no-undef */
let cords = null;
async function init() {
  const { geolocation } = ymaps;
  const myMap = new ymaps.Map('map',
    {
      center: [66.25, 94.15],
      zoom: 5,
    },
    {
      searchControlProvider: 'yandex#search',
    });
  // Сравним положение, вычисленное по ip пользователя и
  // положение, вычисленное средствами браузера.
  const result = await geolocation.get({
    provider: 'yandex',
    mapStateAutoApply: true,
  });
  // Красным цветом пометим положение, вычисленное через ip.
  result.geoObjects.options.set('preset', 'islands#redCircleIcon');
  result.geoObjects.get(0).properties.set({
    balloonContentBody: 'Мое местоположение',
  });
  myMap.geoObjects.add(result.geoObjects);
  // eslint-disable-next-line no-underscore-dangle
  cords = result.geoObjects.get(0).geometry._coordinates;
}
const loadYmap = async () => {
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?loadByRequire=1&lang=ru_RU&amp;apikey=8f7a96c1-9c80-43e4-9ae4-b236fc803e01';
      document.body.append(script);
      setTimeout(() => {
        try {
          ymaps.load(init);
          clearInterval(interval);
          resolve();
        } catch (error) {
          script.remove();
        }
      }, 500);
    }, 1000);
  });
};
loadYmap();
export default async function getCoordsFromYMap() {
  const result = await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (cords !== null) {
        clearInterval(interval);
        resolve(cords);
      }
    }, 100);
  });
  return result;
}
