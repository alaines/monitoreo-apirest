
export async function getMapImage({ lat, lng, zoom = 17, width = 400, height = 220 }) {
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWxhaW5lcyIsImEiOiJjanNjYXZob3gwaXJpM3lsMXFza2txemNkIn0.u9qNnHc374n27lcWWZPPQg';
  // Mapbox Static Images API
  const marker = `pin-l+ff0000(${lng},${lat})`;
  const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${marker}/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
  const mapboxResponse = await fetch(mapboxUrl);
  const mapboxBlob = await mapboxResponse.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      let type = 'PNG';
      if (mapboxBlob.type === 'image/jpeg') type = 'JPEG';
      resolve({ dataUrl: reader.result, type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(mapboxBlob);
  });
}
