import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface DwgViewerProps {
  fileUrl: string;
  fileName: string;
}

export function DwgViewer({ fileUrl, fileName }: DwgViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDxf, setIsDxf] = useState(false);

  useEffect(() => {
    // Si viene del endpoint de conversión, siempre es DXF
    const isDxfFile = fileName.toLowerCase().includes('dxf') || fileName.toLowerCase().includes('dwg');
    setIsDxf(isDxfFile);

    if (!isDxfFile) {
      setLoading(false);
      setError('Archivo no compatible.');
      return;
    }

    if (!containerRef.current) return;

    // Configurar escena Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Controles de órbita
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Grilla de referencia
    const gridHelper = new THREE.GridHelper(200, 20);
    scene.add(gridHelper);

    // Cargar DXF (intentar)
    loadDxf(fileUrl, scene)
      .then(() => {
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message || 'Error al cargar el archivo DXF');
      });

    // Animación
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Manejo de resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [fileUrl, fileName]);

  async function loadDxf(url: string, scene: THREE.Scene) {
    try {
      // Intentar cargar como DXF usando three-dxf-loader
      const { DXFLoader } = await import('three-dxf-loader');
      const loader = new DXFLoader();
      
      return new Promise((resolve, reject) => {
        loader.load(
          url,
          (dxf: any) => {
            // Centrar el modelo
            const box = new THREE.Box3().setFromObject(dxf);
            const center = box.getCenter(new THREE.Vector3());
            dxf.position.sub(center);
            
            scene.add(dxf);
            resolve(dxf);
          },
          undefined,
          (error: any) => reject(error)
        );
      });
    } catch (err) {
      throw new Error('No se pudo cargar el visor DXF. Asegúrese de que el archivo sea DXF válido.');
    }
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p>Cargando archivo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4">
        <i className="fas fa-exclamation-triangle fa-4x text-warning mb-3"></i>
        <h5 className="mb-3">No se puede visualizar</h5>
        <p className="text-muted mb-3">{error}</p>
        <div className="alert alert-info">
          <strong>Opciones disponibles:</strong>
          <ul className="mb-0 mt-2">
            <li>Descargar el archivo DWG y abrirlo con AutoCAD/software compatible</li>
            <li>Convertir DWG a DXF para visualización en navegador</li>
            <li>Solicitar versión PDF del plano</li>
          </ul>
        </div>
        <a href={fileUrl} download className="btn btn-primary mt-3">
          <i className="fas fa-download me-2"></i>
          Descargar Archivo
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <div className="position-absolute top-0 start-0 m-3 bg-white p-2 rounded shadow-sm">
        <small className="text-muted">
          <i className="fas fa-mouse me-1"></i>
          Click izquierdo: rotar | Scroll: zoom | Click derecho: mover
        </small>
      </div>
    </div>
  );
}
