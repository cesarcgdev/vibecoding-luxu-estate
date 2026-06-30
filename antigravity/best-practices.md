# Checklist Condensado: Mejores Prácticas para Real Estate en Next.js

## ⚡ Rendimiento y Renderizado
* **Páginas de Propiedades (Detalles):** Usa **ISR** para carga estática ultrarrápida con actualización en segundo plano.
* **Página de Búsqueda/Filtros:** Usa **SSR / Server Components** para leer filtros de la URL y consultar la BD en tiempo real.
* **Páginas Estáticas (Nosotros, Contacto):** Usa **SSG** clásico.
* **Componentes Pesados:** Usa `next/dynamic` (lazy load) para mapas interactivos, recorridos 3D o chats.

## 🖼️ Optimización de Imágenes
* **`next/image`:** Uso estricto para servir en WebP/AVIF y evitar saltos visuales (CLS).
* **Hero Image:** Aplica `priority={true}` a la foto principal de la propiedad para mejorar el LCP.
* **CDN Dedicado:** Utiliza CDNs (Supabase, Cloudinary) para optimizar/redimensionar fotos pesadas subidas por agentes.
* **Galerías:** Implementa carga diferida; carga solo las fotos que el usuario está viendo.

## 🔍 SEO y Visibilidad
* **Metadatos Dinámicos:** Genera títulos descriptivos por listado con `generateMetadata`.
* **Datos Estructurados (JSON-LD):** Usa esquema `RealEstateListing` para salir destacado en Google con precio y fotos.
* **Sitemaps Dinámicos:** Actualiza el sitemap automáticamente (`app/sitemap.ts`) con los nuevos listados.
* **URLs Amigables:** Usa "slugs" descriptivos (`/casa-en-madrid`) en lugar de IDs de base de datos.

## 🗺️ Experiencia de Usuario (UX/UI)
* **Filtros en la URL:** Guarda el estado de la búsqueda en la URL (`?precioMax=1M`) para que sea compartible.
* **Mapas Interactivos:** Sincroniza la lista de resultados con los límites visibles de un mapa (Mapbox/Google Maps).
* **Guardar Favoritos:** Botón de corazón funcional (LocalStorage para visitantes, Base de Datos para usuarios logueados).
* **Skeletons de Carga:** Muestra la silueta animada de las propiedades mientras cargan, nunca una pantalla blanca.
* **Paginación Controlada:** Prefiere botón de "Cargar más" o paginación sobre el scroll infinito puro.

## 💾 Datos y Seguridad (Supabase/PostgreSQL)
* **Búsquedas Geoespaciales:** Activa y usa `PostGIS` para filtrar propiedades por radio de distancia.
* **Reglas RLS:** Políticas estrictas: solo el dueño edita su listado, todos pueden leer listados públicos.

## 💡 Features "Premium"
* **Calculadora de Hipotecas:** Widget directo en la ficha de la propiedad.
* **Tours 3D:** Soporte nativo para iframes de Matterport o video-recorridos.
* **Contacto "Sticky":** Tarjeta del agente siempre visible al lado derecho al hacer scroll en escritorio.
* **Alertas Personalizadas:** Suscripción por email ("Avísame cuando haya casas en Miami por debajo de 500k").
