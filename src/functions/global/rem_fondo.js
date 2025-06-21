const input = document.getElementById('inputImage');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let loadedImage = null;

input.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    loadedImage = img;
  };
  img.src = URL.createObjectURL(file);
});

document.getElementById('generateBtn').addEventListener('click', () => {
  if (!loadedImage) {
    alert('Primero selecciona una imagen');
    return;
  }

  canvas.width = loadedImage.width;
  canvas.height = loadedImage.height;

  ctx.drawImage(loadedImage, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const [r0, g0, b0] = [data[0], data[1], data[2]]; // Pixel superior izquierdo
  const tolerance = 40;

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const diff = Math.sqrt((r - r0) ** 2 + (g - g0) ** 2 + (b - b0) ** 2);
    if (diff < tolerance) {
      data[i + 3] = 0; // Transparente
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const link = document.createElement('a');
  link.download = 'imagen_sin_fondo.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
