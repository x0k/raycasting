import {
  createScene,
  createPlayer,
  renderGame,
  Vector2,
  sceneSize,
} from "./game";

const SCREEN_FACTOR = 30;
const SCREEN_WIDTH = Math.floor(16 * SCREEN_FACTOR);
const SCREEN_HEIGHT = Math.floor(9 * SCREEN_FACTOR);

async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = reject;
  });
}

async function loadImageData(url: string): Promise<ImageData> {
  const image = await loadImage(url);
  const canvas = new OffscreenCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("2d canvas is not supported");
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, image.width, image.height);
}

(async () => {
  const gameCanvas = document.getElementById(
    "game"
  ) as HTMLCanvasElement | null;
  if (gameCanvas === null) throw new Error("No canvas with id `game` is found");
  const factor = 80;
  gameCanvas.width = 16 * factor;
  gameCanvas.height = 9 * factor;
  const ctx = gameCanvas.getContext("2d");
  if (ctx === null) throw new Error("2D context is not supported");
  ctx.imageSmoothingEnabled = false;

  const [wall, key] = await Promise.all([
    loadImageData("images/custom/wall.png"),
    loadImageData("images/custom/key.png"),
  ]);

  const scene = createScene([
    [null, null, wall, wall, null, null, null],
    [null, null, null, null, null, null, null],
    [wall, null, null, null, null, null, null],
    [wall, null, null, null, null, null, null],
    [null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ]);

  const sprites = [
    {
      imageData: key,
      position: new Vector2(1.5, 1.5),
    },
  ];

  const player = createPlayer(sceneSize(scene).scale(0.63), Math.PI * 1.25);

  const backImageData = new ImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
  backImageData.data.fill(255);
  const backCanvas = new OffscreenCanvas(SCREEN_WIDTH, SCREEN_HEIGHT);
  const backCtx = backCanvas.getContext("2d");
  if (backCtx === null) throw new Error("2D context is not supported");
  backCtx.imageSmoothingEnabled = false;
  const display = {
    ctx,
    backCtx,
    backImageData,
    zBuffer: Array(SCREEN_WIDTH).fill(0),
  };

  window.addEventListener("keydown", (e) => {
    if (!e.repeat) {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          player.movingForward = true;
          break;
        case "ArrowDown":
        case "KeyS":
          player.movingBackward = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          player.turningLeft = true;
          break;
        case "ArrowRight":
        case "KeyD":
          player.turningRight = true;
          break;
      }
    }
  });
  window.addEventListener("keyup", (e) => {
    if (!e.repeat) {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          player.movingForward = false;
          break;
        case "ArrowDown":
        case "KeyS":
          player.movingBackward = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          player.turningLeft = false;
          break;
        case "ArrowRight":
        case "KeyD":
          player.turningRight = false;
          break;
      }
    }
  });

  let prevTimestamp = 0;
  const frame = (timestamp: number) => {
    const deltaTime = (timestamp - prevTimestamp) / 1000;
    prevTimestamp = timestamp;
    renderGame(display, deltaTime, player, scene, sprites);
    window.requestAnimationFrame(frame);
  };
  window.requestAnimationFrame((timestamp) => {
    prevTimestamp = timestamp;
    window.requestAnimationFrame(frame);
  });
})();
// TODO: Hot reload assets
// TODO: Try lighting with normal maps that come with some of the assets
// TODO: Load assets asynchronously
//   While a texture is loading, replace it with a color tile.
