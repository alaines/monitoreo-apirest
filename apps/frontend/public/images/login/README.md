# Imagen de Fondo para Login

## Instrucciones

Para personalizar la imagen de fondo del login, sube tu imagen aquí con el nombre `background.jpg`

### Opción 1: Subir tu propia imagen

```bash
# Desde tu máquina local (usando SCP):
scp mi-imagen.jpg usuario@192.168.18.230:/home/alaines/monitoreo-apirest/apps/frontend/public/images/login/background.jpg
```

### Opción 2: Descargar una imagen de internet

```bash
cd /home/alaines/monitoreo-apirest/apps/frontend/public/images/login

# Ejemplo: imagen de unsplash
wget https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920 -O background.jpg

# O una imagen relacionada con tráfico/ciudad
wget https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920 -O background.jpg
```

### Opción 3: Usar un color sólido (sin imagen)

Si no tienes imagen, el login usará un fondo azul degradado por defecto.

## Recomendaciones

- **Formato:** JPG o PNG
- **Tamaño:** 1920x1080 píxeles (Full HD)
- **Peso:** Máximo 500KB (optimizar antes de subir)
- **Contenido:** Imagen relacionada con infraestructura, ciudad, tecnología o tráfico

## Optimizar imagen antes de subir

Usa herramientas como:
- https://tinypng.com
- https://squoosh.app
- ImageMagick: `convert input.jpg -quality 85 -resize 1920x1080 background.jpg`
