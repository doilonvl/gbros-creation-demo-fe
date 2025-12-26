"use client";

import { useEffect } from "react";
import * as THREE from "three";

type MouseState = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vX: number;
  vY: number;
};

class PixelatedVideoEffect {
  container: HTMLElement;
  video: HTMLVideoElement;
  canvasClassName?: string;
  isMobile = false;
  isDestroyed = false;
  time = 0;
  rafId = 0;

  mouse: MouseState = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };
  settings = { grid: 25, mouse: 0.25, strength: 0.1, relaxation: 0.925 };

  scene?: THREE.Scene;
  camera?: THREE.OrthographicCamera;
  renderer?: THREE.WebGLRenderer;
  material?: THREE.ShaderMaterial;
  planeGeometry?: THREE.PlaneGeometry;
  planeMesh?: THREE.Mesh;
  videoTexture?: THREE.VideoTexture;
  dataTexture?: THREE.DataTexture;
  canvas?: HTMLCanvasElement;

  width = 0;
  height = 0;

  onMouseMove = (e: MouseEvent) => this.handlePointerMove(e.clientX, e.clientY);
  onResize = () => this.handleResize();

  constructor(
    container: HTMLElement,
    video: HTMLVideoElement,
    canvasClassName?: string
  ) {
    this.container = container;
    this.video = video;
    this.canvasClassName = canvasClassName;
    this.isMobile = window.innerWidth < 1000;
    this.init();
  }

  async init() {
    try {
      await new Promise<void>((resolve) => {
        if (document.readyState === "complete") resolve();
        else window.addEventListener("load", () => resolve(), { once: true });
      });

      await new Promise<void>((resolve) => {
        if (this.video.readyState >= 2) resolve();
        else
          this.video.addEventListener("loadeddata", () => resolve(), {
            once: true,
          });
      });

      if (this.isDestroyed) return;

      this.videoTexture = this.createVideoTexture();
      this.initializeScene(this.videoTexture);
      this.setupEvents();
      this.render();
    } catch (error) {
      console.error("Pixelated video init failed:", error);
    }
  }

  createVideoTexture() {
    const texture = new THREE.VideoTexture(this.video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.flipY = true;
    return texture;
  }

  updateCameraAndGeometry() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    const videoWidth = this.video.videoWidth || 1920;
    const videoHeight = this.video.videoHeight || 1080;
    const containerAspect = this.width / this.height;
    const videoAspect = videoWidth / videoHeight;

    let scaleX = 1;
    let scaleY = 1;
    if (containerAspect > videoAspect) scaleY = containerAspect / videoAspect;
    else scaleX = videoAspect / containerAspect;

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.camera.position.z = 1;
    this.planeGeometry = new THREE.PlaneGeometry(2 * scaleX, 2 * scaleY);
  }

  createCleanGrid() {
    const size = this.settings.grid;
    const totalSize = size * size * 4;
    const data = new Float32Array(totalSize);

    for (let i = 3; i < totalSize; i += 4) data[i] = 255;

    this.dataTexture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.dataTexture.magFilter = this.dataTexture.minFilter =
      THREE.NearestFilter;

    if (this.material) {
      this.material.uniforms.uDataTexture.value = this.dataTexture;
      this.material.uniforms.uDataTexture.value.needsUpdate = true;
    }
  }

  initializeScene(texture: THREE.VideoTexture) {
    this.scene = new THREE.Scene();
    this.updateCameraAndGeometry();
    this.createCleanGrid();

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`;

    const fragmentShader = `
      uniform sampler2D uDataTexture;
      uniform sampler2D uTexture;
      varying vec2 vUv;
      void main() {
        vec4 offset = texture2D(uDataTexture, vUv);
        gl_FragColor = texture2D(uTexture, vUv - 0.02 * offset.rg);
      }`;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        uTexture: { value: texture },
        uDataTexture: { value: this.dataTexture },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });

    this.planeMesh = new THREE.Mesh(this.planeGeometry!, this.material);
    this.scene.add(this.planeMesh);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.canvas = this.renderer.domElement;
    if (this.canvasClassName) {
      this.canvas.className = this.canvasClassName;
    }
    this.container.appendChild(this.canvas);

    this.video.style.opacity = "0";
  }

  updateDataTexture() {
    if (!this.dataTexture || this.isMobile) return;

    const data = this.dataTexture.image.data as Float32Array;
    const size = this.settings.grid;
    const relaxation = this.settings.relaxation;

    for (let i = 0; i < data.length; i += 4) {
      data[i] *= relaxation;
      data[i + 1] *= relaxation;
    }

    if (Math.abs(this.mouse.vX) < 0.001 && Math.abs(this.mouse.vY) < 0.001) {
      this.mouse.vX *= 0.9;
      this.mouse.vY *= 0.9;
      this.dataTexture.needsUpdate = true;
      return;
    }

    const gridMouseX = size * this.mouse.x;
    const gridMouseY = size * (1 - this.mouse.y);
    const maxDist = size * this.settings.mouse;
    const maxDistSq = maxDist * maxDist;
    const aspect = this.height / this.width;
    const strengthFactor = this.settings.strength * 100;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const distance =
          (gridMouseX - i) ** 2 / aspect + (gridMouseY - j) ** 2;
        if (distance < maxDistSq) {
          const index = 4 * (i + size * j);
          const power = Math.min(10, maxDist / Math.sqrt(distance));
          data[index] += strengthFactor * this.mouse.vX * power;
          data[index + 1] -= strengthFactor * this.mouse.vY * power;
        }
      }
    }

    this.mouse.vX *= 0.9;
    this.mouse.vY *= 0.9;
    this.dataTexture.needsUpdate = true;
  }

  handlePointerMove(clientX: number, clientY: number) {
    if (this.isMobile) return;

    const rect = this.container.getBoundingClientRect();
    const newX = (clientX - rect.left) / rect.width;
    const newY = (clientY - rect.top) / rect.height;

    this.mouse.vX = newX - this.mouse.prevX;
    this.mouse.vY = newY - this.mouse.prevY;
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = newX;
    this.mouse.y = newY;
  }

  setupEvents() {
    if (!this.isMobile) {
      this.container.addEventListener("mousemove", this.onMouseMove);
    }
    window.addEventListener("resize", this.onResize);
  }

  handleResize() {
    this.isMobile = window.innerWidth < 1000;
    if (!this.renderer || !this.planeMesh) return;

    this.updateCameraAndGeometry();
    this.planeMesh.geometry.dispose();
    this.planeMesh.geometry = this.planeGeometry!;
    this.renderer.setSize(this.width, this.height);
    this.createCleanGrid();
  }

  render() {
    if (this.isDestroyed || !this.renderer || !this.scene || !this.camera) {
      return;
    }

    this.time += 0.05;
    this.updateDataTexture();

    if (this.material) this.material.uniforms.time.value = this.time;
    if (this.videoTexture) this.videoTexture.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(() => this.render());
  }

  destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.rafId);

    this.container.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("resize", this.onResize);

    if (this.renderer) this.renderer.dispose();
    if (this.material) this.material.dispose();
    if (this.planeGeometry) this.planeGeometry.dispose();
    if (this.videoTexture) this.videoTexture.dispose();
    if (this.dataTexture) this.dataTexture.dispose();

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.video.style.opacity = "1";
  }
}

export function useNfPixelatedVideo(
  containerRef: React.RefObject<HTMLElement>,
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasClassName?: string
) {
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const effect = new PixelatedVideoEffect(
      container,
      video,
      canvasClassName
    );
    return () => effect.destroy();
  }, [containerRef, videoRef, canvasClassName]);
}
