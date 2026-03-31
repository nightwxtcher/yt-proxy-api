# YT Proxy API 🚀

[Español](#español) | [English](#english)

---

## Español

Una API de alto rendimiento diseñada para servir como proxy de YouTube, permitiendo búsquedas, resolución de videos/audio y streaming directo con bypass de restricciones.

### Características
- 🔍 **Búsqueda**: Motor de búsqueda de YouTube integrado.
- 📺 **Video y Audio**: Resolución de URLs de streaming HLS.
- 📥 **Descarga**: Funcionalidad para descargar audio directamente en formato M4A.
- 🛡️ **Proxy Inteligente**: Sistema de proxy integrado para bypass de CORS y restricciones geográficas.
- 📱 **Multi-Cliente**: Soporte para múltiples firmas de cliente (Web, iOS, Android, TV).

### Requisitos
- [Node.js](https://nodejs.org/) (v18 o superior recomendado)
- [npm](https://www.npmjs.com/)

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/yt-proxy-api.git

# Entrar al directorio
cd yt-proxy-api

# Instalar dependencias
npm install
```

### Uso
Para iniciar el servidor en modo producción:
```bash
npm start
```
El servidor estará corriendo en `http://localhost:3000`.

### Endpoints Principales
- `GET /api/v1/search?q=query`: Busca videos en YouTube.
- `GET /api/v1/video/:id`: Obtiene metadatos y URL de streaming de video.
- `GET /api/v1/audio/:id`: Obtiene metadatos y URL de streaming de audio.
- `GET /api/v1/download/:id`: Descarga el audio del video.
- `GET /api/v1/proxy?url=URL`: Proxy de red genérico para recursos de YT.

---

## English

A high-performance API designed to act as a YouTube proxy, enabling search, video/audio resolution, and direct streaming with restriction bypassing.

### Features
- 🔍 **Search**: Integrated YouTube search engine.
- 📺 **Video & Audio**: HLS streaming URL resolution.
- 📥 **Download**: Functionality to download audio directly in M4A format.
- 🛡️ **Smart Proxy**: Built-in proxy system for CORS bypass and geographical restrictions.
- 📱 **Multi-Client**: Support for multiple client signatures (Web, iOS, Android, TV).

### Requirements
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/yt-proxy-api.git

# Enter the directory
cd yt-proxy-api

# Install dependencies
npm install
```

### Usage
To start the server in production mode:
```bash
npm start
```
The server will be running at `http://localhost:3000`.

### Main Endpoints
- `GET /api/v1/search?q=query`: Search for videos on YouTube.
- `GET /api/v1/video/:id`: Get video metadata and streaming URL.
- `GET /api/v1/audio/:id`: Get audio metadata and streaming URL.
- `GET /api/v1/download/:id`: Download video audio.
- `GET /api/v1/proxy?url=URL`: Generic network proxy for YT resources.

---

### License
This project is licensed under the **ISC License**.
