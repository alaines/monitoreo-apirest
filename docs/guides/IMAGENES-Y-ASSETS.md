# Gestión de Imágenes y Assets

## Dónde Subir Imágenes para el Sistema

### 1. Carpeta Pública del Proyecto (Recomendado para el Login)

**Ubicación:** `/apps/frontend/public/`

Las imágenes en esta carpeta están disponibles directamente en la raíz del servidor.

```
apps/frontend/public/
├── images/
│   ├── logo.png
│   ├── login-bg.jpg
│   ├── login-illustration.svg
│   └── favicon.ico
└── assets/
    ├── icons/
    └── illustrations/
```

**Uso en el código:**
```tsx
// En LoginPage.tsx
<img src="/images/login-bg.jpg" alt="Login Background" />
<img src="/images/logo.png" alt="Logo" />
```

**Ventajas:**
- Rápido y sencillo
- No requiere configuración adicional
- Disponible inmediatamente
- Ideal para imágenes que no cambian frecuentemente

### 2. Carpeta src/assets (Para imágenes que se procesan con Vite)

**Ubicación:** `/apps/frontend/src/assets/`

Las imágenes se procesan y optimizan durante el build.

```
apps/frontend/src/assets/
├── images/
│   ├── login/
│   │   ├── background.jpg
│   │   └── illustration.svg
│   ├── dashboard/
│   └── icons/
└── styles/
```

**Uso en el código:**
```tsx
import loginBg from '@/assets/images/login/background.jpg';
import logo from '@/assets/images/logo.png';

// En el componente
<img src={loginBg} alt="Background" />
```

**Ventajas:**
- Optimización automática de imágenes
- Cache busting (hash en el nombre del archivo)
- TypeScript puede validar que la imagen existe
- Ideal para imágenes que forman parte del código

### 3. Servicio CDN Externo (Para Producción a Gran Escala)

Para un sistema en producción con muchas imágenes, se recomienda usar un CDN:

#### Opciones Gratuitas:
- **Cloudinary** - https://cloudinary.com
  - Plan gratuito: 25 GB almacenamiento, 25 GB bandwidth/mes
  - Optimización automática de imágenes
  - Transformaciones on-the-fly

- **ImgBB** - https://imgbb.com
  - Completamente gratuito
  - API simple
  - Ideal para pequeños proyectos

- **ImageKit** - https://imagekit.io
  - Plan gratuito: 20 GB almacenamiento, 20 GB bandwidth/mes
  - Optimización y transformaciones

#### Ejemplo con Cloudinary:
```tsx
const CLOUDINARY_URL = 'https://res.cloudinary.com/tu-cuenta';

<img src={`${CLOUDINARY_URL}/image/upload/v1/login-bg.jpg`} alt="Background" />
```

### 4. Base de Datos (No Recomendado para Imágenes Grandes)

Solo para imágenes muy pequeñas como avatares:
```sql
-- Almacenar URL o path
avatar_url VARCHAR(500)

-- O en base64 (NO RECOMENDADO)
avatar_base64 TEXT
```

## Recomendación para tu Proyecto

### Para la Imagen de Login:

1. **Crea la carpeta de imágenes:**
```bash
mkdir -p /home/alaines/monitoreo-apirest/apps/frontend/public/images/login
```

2. **Sube tu imagen:**
```bash
# Ejemplo: copiar imagen desde tu computadora
cp /ruta/a/tu/imagen/login-background.jpg /home/alaines/monitoreo-apirest/apps/frontend/public/images/login/
```

3. **Usa en LoginPage.tsx:**
```tsx
<Box
  sx={{
    backgroundImage: 'url(/images/login/login-background.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
  {/* Contenido del login */}
</Box>
```

### Para el Logo del Sistema:

1. **Coloca el logo en public:**
```bash
cp logo.png /home/alaines/monitoreo-apirest/apps/frontend/public/images/logo.png
```

2. **Actualiza el favicon:**
```bash
cp favicon.ico /home/alaines/monitoreo-apirest/apps/frontend/public/favicon.ico
```

3. **Usa en Layout.tsx:**
```tsx
<img src="/images/logo.png" alt="Logo Sistema" style={{ height: 40 }} />
```

## Optimización de Imágenes

### Antes de subir, optimiza tus imágenes:

**Herramientas Online (Gratis):**
- TinyPNG - https://tinypng.com (PNG, JPG)
- Squoosh - https://squoosh.app (Todos los formatos)
- CompressJPEG - https://compressjpeg.com

**Herramientas CLI:**
```bash
# Instalar ImageMagick
sudo apt install imagemagick

# Redimensionar imagen
convert input.jpg -resize 1920x1080 output.jpg

# Comprimir con calidad 85%
convert input.jpg -quality 85 output.jpg
```

### Formatos Recomendados:

- **Login Background:** JPG (comprimido, max 500KB)
- **Logo:** PNG con transparencia o SVG
- **Iconos:** SVG (escalables, peso mínimo)
- **Fotografías:** JPG optimizado
- **Ilustraciones:** SVG o PNG

## Estructura Completa Recomendada

```
apps/frontend/public/
├── images/
│   ├── login/
│   │   ├── background.jpg        # Fondo del login
│   │   └── illustration.svg      # Ilustración decorativa
│   ├── logo.png                  # Logo principal
│   ├── logo-white.png            # Logo versión blanca
│   └── favicon.ico               # Icono del navegador
├── assets/
│   └── documents/
│       └── manual.pdf
└── robots.txt

apps/frontend/src/assets/
├── images/
│   ├── dashboard/
│   ├── icons/
│   └── illustrations/
└── styles/
```

## Ejemplo Completo: Mejorar LoginPage con Imagen de Fondo

1. **Subir imagen:**
```bash
# Desde tu máquina local a través de SCP:
scp mi-imagen-login.jpg usuario@servidor:/home/alaines/monitoreo-apirest/apps/frontend/public/images/login/background.jpg

# O descargar de internet:
cd /home/alaines/monitoreo-apirest/apps/frontend/public/images/login
wget https://ejemplo.com/imagen-login.jpg -O background.jpg
```

2. **Actualizar LoginPage.tsx:**
```tsx
<Grid container sx={{ minHeight: '100vh' }}>
  {/* Columna izquierda con imagen */}
  <Grid 
    item 
    xs={false} 
    md={7} 
    sx={{
      backgroundImage: 'url(/images/login/background.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Overlay oscuro
      }
    }}
  >
    {/* Contenido sobre la imagen */}
  </Grid>
  
  {/* Columna derecha con formulario */}
  <Grid item xs={12} md={5}>
    {/* Formulario de login */}
  </Grid>
</Grid>
```

## Conclusión

**Para comenzar rápidamente:**
- Usa la carpeta `public/images/` 
- Coloca tus imágenes ahí
- Referencialas con `/images/nombre.jpg`

**Para producción:**
- Considera usar un CDN como Cloudinary
- Optimiza todas las imágenes antes de subirlas
- Usa formatos modernos como WebP cuando sea posible
