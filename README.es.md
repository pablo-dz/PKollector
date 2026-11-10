# PKollector

<p align="right">
  <a href="README.md">
    <img alt="English" src="https://img.shields.io/badge/English-e5e7eb?style=for-the-badge&labelColor=e5e7eb&color=374151" />
  </a>
  <img alt="Español (idioma actual)" src="https://img.shields.io/badge/Espa%C3%B1ol-3b4cca?style=for-the-badge" />
</p>

<p align="center">
  <img src="./frontend/src/assets/logo_pkollector.png" alt="Logo de PKollector" width="600" />
</p>

<p align="center">
  <strong>Tu colección Pokémon TCG, ordenada y siempre a mano.</strong><br />
  Una herramienta hecha por un coleccionista, para coleccionistas.
</p>

<p align="center">
  <a href="https://p-kollector.vercel.app/"><strong>🎴 Visita PKollector</strong></a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
</p>

## 👋 ¿Por qué hice PKollector?

¡Hola! Colecciono cartas Pokémon y, como quizá te ha pasado, más de una vez
perdí la cuenta de lo que ya tenía y de lo que todavía estaba buscando. Entre
distintos sets, carpetas y cartas repetidas, las notas y listas terminaban
desperdigadas.

Por eso armé PKollector: un lugar para revisar la colección, anotar cuántas
copias tienes y descubrir qué te falta. Así puedes pasar menos tiempo tratando
de acordarte y más tiempo disfrutando el hobby. Si a ti también te sirve, ¡me
encantará saberlo!

## ✨ ¿Qué puedes hacer en PKollector?

- **Encontrar una carta sin revolver las carpetas:** busca por nombre y ordena
  los resultados por nombre, fecha, HP o número de carta.
- **Afilar la búsqueda:** filtra por serie, set, tipo de energía, categoría,
  subtipo, rareza, rango de HP o si la carta ya está en tu colección.
- **Revisar cada detalle:** abre una carta para consultar sus ataques, costes de
  energía, habilidades, debilidades, resistencias, rareza e ilustrador.
- **Llevar la cuenta de verdad:** registra cuántas copias tienes; las cartas
  propias y las que te faltan se distinguen en el catálogo.
- **Tener a mano lo que buscas:** agrega cartas a tu lista de deseos.
- **Saber qué puedes intercambiar:** encuentra tus cartas repetidas y cuántas
  copias extra tienes de cada una.
- **Avanzar set por set:** explora los sets, busca y ordénalos, mira cartas
  destacadas y consulta cuánto has completado.
- **Ver el progreso de un vistazo:** revisa las cartas registradas y las que te
  faltan, tanto en el total como en cada set.
- **Empezar sin complicarte:** usa PKollector como invitado y crea una cuenta
  cuando quieras; al registrarte, tu colección de invitado se transfiere a ella.

## 🌐 Pruébalo en línea

La aplicación está publicada y puedes abrirla aquí:

### 👉 [p-kollector.vercel.app](https://p-kollector.vercel.app/)

Entra, explora el catálogo y empieza a organizar tu colección. También puedes
crear una cuenta para conservar tu colección vinculada a tu usuario.

## ☁️ ¿Dónde está desplegado?

La versión en línea está formada por tres partes:

| Parte | Servicio | Qué hace |
| --- | --- | --- |
| Aplicación web | [Vercel](https://vercel.com/) | Publica el frontend de React |
| API | [Render](https://render.com/) | Ejecuta el backend de FastAPI |
| Base de datos | [Neon](https://neon.tech/) | Aloja PostgreSQL |

El frontend se comunica con la API y esta guarda los datos en PostgreSQL. Para
desplegar una instancia propia, configura las variables de entorno de producción
en cada servicio: `VITE_API_URL` en Vercel apunta a la URL pública de la API;
`DATABASE_URL` en Render apunta a la base de Neon; y `CORS_ORIGINS` en Render
debe incluir el dominio del frontend publicado. No guardes credenciales de
producción en el repositorio.

## 🧰 Tecnologías

| Área | Tecnologías |
| --- | --- |
| Frontend | React, Vite, JavaScript |
| Backend | Python, FastAPI, SQLAlchemy |
| Base de datos | PostgreSQL |
| Datos de cartas | [Pokémon TCG API v2](https://pokemontcg.io/) |

## 🗂️ Estructura del proyecto

```text
.
├── backend/
│   ├── app/                 # API, modelos y acceso a datos
│   ├── scripts/             # Creación de tablas e importación de datos
│   └── requirements.txt
├── frontend/
│   ├── src/                 # Aplicación React
│   └── package.json
└── docker-compose.yml       # Servicio PostgreSQL para desarrollo
```

## 🚀 Cómo ejecutarlo en tu equipo

Necesitas tener instalado:
- Python 3.10 o posterior.
- Node.js y npm.
- Docker y Docker Compose, o una instancia propia de PostgreSQL.
- Una clave de Pokémon TCG API es opcional, pero puede ser útil para importar
  datos con menos restricciones.

### 1. Levanta la base de datos

Desde la carpeta principal del proyecto:

```bash
docker compose up -d db
```

[`docker-compose.yml`](./docker-compose.yml) inicia PostgreSQL en el puerto
`5433` y crea la base `pkollector`. Las credenciales incluidas son para
desarrollo local; no las uses en un entorno público o de producción.

### 2. Prepara el backend

Crea un entorno virtual e instala las dependencias del servidor:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

En Windows, activa el entorno virtual con:

```powershell
.venv\Scripts\Activate.ps1
```

Crea `backend/.env` con la URL de PostgreSQL. La clave de la API externa es
opcional:

```dotenv
DATABASE_URL=postgresql+psycopg://pkollector:pkollector@localhost:5433/pkollector
POKEMONTCG_API_KEY=
CORS_ORIGINS=http://localhost:5173
```

`DATABASE_URL` es necesaria para conectar el backend a PostgreSQL.
`POKEMONTCG_API_KEY` se usa al importar datos desde la Pokémon TCG API.
`CORS_ORIGINS` permite configurar los orígenes autorizados por CORS; si se
omite, el backend permite `http://localhost:5173`.

Crea las tablas y carga el catálogo de cartas:

```bash
python -m scripts.create_tables
python -m scripts.ingest
```

La importación completa puede tardar y depende de la disponibilidad y los
límites de solicitudes de la API externa. Para importar solo algunas páginas,
pasa la página inicial y la final:

```bash
python -m scripts.ingest 1 5
```

Opcionalmente, genera las cartas destacadas que aparecen en las vistas de sets:

```bash
python -m scripts.compute_showcase
```

Inicia la API (desde el directorio `backend`):

```bash
uvicorn app.main:app --reload
```

¡Listo! La API estará disponible en <http://localhost:8000>. También puedes
probar sus endpoints desde la documentación interactiva de FastAPI en
<http://localhost:8000/docs>.

> **Atención:** `python -m scripts.create_tables reset` elimina las tablas
> existentes antes de crearlas de nuevo. Esto borra los datos guardados.

### 3. Arranca la aplicación web

En otra terminal, desde la carpeta principal del proyecto:

```bash
cd frontend
npm install
npm run dev
```

Vite mostrará la dirección local en la terminal (normalmente
<http://localhost:5173>). El frontend usa `http://localhost:8000` como URL de API
por defecto. Si necesitas cambiarla, crea `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:8000
```

## 🧩 Base de datos

El catálogo, los detalles de las cartas y las colecciones se guardan por
separado para que sea más fácil entender cómo se conecta todo. En el diagrama,
cada carta pertenece a un set; sus ataques y habilidades se guardan en tablas
propias, y la colección y la lista de deseos registran lo que cada persona tiene
o está buscando.

Las tablas `collection` y `wishlist` evitan duplicar la misma carta para un
mismo usuario.

```mermaid
erDiagram
    SETS {
        string id PK
        string name
        string series
        date release_date
        string image_logo
    }

    CARDS {
        string id PK
        string set_id FK
        string name
        string supertype
        string hp
        string rarity
        string number
    }

    CARD_ABILITIES {
        int id PK
        string card_id FK
        int position
        string name
        text text
        string type
    }

    CARD_ATTACKS {
        int id PK
        string card_id FK
        int position
        string name
        string cost
        string damage
    }

    CARD_WEAKNESSES {
        int id PK
        string card_id FK
        int position
        string type
        string value
    }

    CARD_RESISTANCES {
        int id PK
        string card_id FK
        int position
        string type
        string value
    }

    USERS {
        string id PK
        string username UK
        string password_hash
        datetime created_at
    }

    COLLECTION {
        int id PK
        string user_id
        string card_id FK
        int quantity
    }

    WISHLIST {
        int id PK
        string user_id
        string card_id FK
    }

    SET_SHOWCASE {
        int id PK
        string set_id FK
        string card_id FK
        int position
    }

    SETS ||--o{ CARDS : contains
    CARDS ||--o{ CARD_ABILITIES : has
    CARDS ||--o{ CARD_ATTACKS : has
    CARDS ||--o{ CARD_WEAKNESSES : has
    CARDS ||--o{ CARD_RESISTANCES : has
    CARDS ||--o{ COLLECTION : tracked_in
    CARDS ||--o{ WISHLIST : requested_in
    SETS ||--o{ SET_SHOWCASE : features
    CARDS ||--o{ SET_SHOWCASE : featured_as
    USERS ||..o{ COLLECTION : identified_by
    USERS ||..o{ WISHLIST : identified_by
```

Las relaciones punteadas entre `USERS` y las tablas de colección representan
una asociación lógica: actualmente, `collection.user_id` y `wishlist.user_id`
no tienen una restricción de clave foránea hacia `users.id`. Las cartas y los
sets destacados sí tienen claves foráneas hacia sus respectivas tablas de
catálogo.

## 🔌 API

Estas son algunas rutas principales para curiosear:

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health` | Comprobar que la API responde |
| `GET` | `/filters` | Obtener opciones para los filtros del catálogo |
| `GET` | `/sets` | Listar sets y cartas de vista previa |
| `GET` | `/sets/{set_id}` | Consultar los datos de un set |
| `GET` | `/cards` | Buscar, filtrar y paginar cartas |
| `GET` | `/cards/{card_id}` | Consultar todos los detalles de una carta |
| `GET` / `PUT` | `/collection` y `/collection/{card_id}` | Consultar o actualizar la colección |
| `GET` / `PUT` | `/wishlist` y `/wishlist/{card_id}` | Consultar o actualizar la lista de deseos |
| `GET` | `/progress` | Obtener el progreso de colección por set |
| `POST` | `/auth/register` | Crear una cuenta |
| `POST` | `/auth/login` | Iniciar sesión |

Las rutas de colección y lista de deseos usan el encabezado `X-User-Id`; no hace
falta configurarlo a mano cuando usas el frontend.

## ✅ Comprobaciones de desarrollo

Si estás trabajando en el frontend, puedes correr estas comprobaciones desde
`frontend/`:

```bash
npm run lint
npm run build
```

## 📦 Datos y atribución

Los datos del catálogo se importan desde [Pokémon TCG API v2](https://pokemontcg.io/),
usando el endpoint `https://api.pokemontcg.io/v2`. Los registros de sets y
cartas, incluidas las URL de imágenes y los datos de precios de mercado,
provienen de esta API; su disponibilidad y precisión dependen del servicio
externo. Los nombres, imágenes y marcas de Pokémon pertenecen a sus respectivos
titulares.

## 🔭 Lo que me gustaría agregar

La idea es que PKollector pueda acompañar mejor una colección real, no solo
llevar una cuenta de cartas. Estas son algunas direcciones que me gustaría
explorar; irán tomando forma de a poco y según lo que resulte más útil.

### 🧭 Mantener el catálogo vivo

El siguiente gran paso es dejar atrás [Pokémon TCG API v2](https://pokemontcg.io/):
está deprecada y sus claves existentes tienen vigencia hasta el **1 de marzo
de 2027**. La colección ya guardada debería seguir disponible, pero para mantener
el catálogo al día habrá que encontrar otra fuente —por ejemplo, Scrydex o
TCGdex— y resolver cómo servir las imágenes a largo plazo. También quiero hacer
más visibles los precios que ya se almacenan y automatizar las actualizaciones
del catálogo y de las cartas destacadas, para que no dependan de ejecutar tareas
manualmente.

### 🗃️ Registrar una colección con más detalle

Hoy una carta se registra por cantidad, pero en la carpeta física importa mucho
más: si es holo o reverse, en qué idioma está y en qué estado se conserva.
Guardar esos datos permitiría describir mejor cada pieza y estimar con más
sentido el valor de la colección. Para que sea sencillo empezar o cambiar de
herramienta, también sería útil poder importar y exportar la colección como
CSV.

Otra forma de explorarla sería agrupar cartas por Pokémon —por ejemplo, ver de
un vistazo todos los Pikachu— o presentar cada set como las páginas 3 × 3 de un
álbum. Y si quiero compartir lo que tengo o lo que ofrezco para intercambio, un
perfil público con enlace podría hacerlo mucho más fácil. A futuro, también me
gustaría mostrar nombres en español; eso dependerá de las opciones que ofrezca
la nueva fuente de datos.

### 📈 Entender mejor lo que tenemos

Con precios y registros a lo largo del tiempo, PKollector podría mostrar cómo
cambia el valor de una carta y de toda la colección, en vez de limitarse a una
foto del precio actual. Sobre esa base podrían aparecer estadísticas por tipo,
rareza o era, el avance por serie, y una ayuda para decidir qué set conviene
completar según lo que falta y su costo aproximado. También sería práctico
recibir un aviso si cambia el precio de una carta que estoy siguiendo.

### 🛠️ Hacerlo más cómodo y confiable

Si la comunidad crece, las cuentas necesitarán más herramientas de protección
y de control: limitar intentos de acceso, usar sesiones que caduquen y permitir
recuperar la contraseña o eliminar una cuenta. Por ahora no existe recuperación
por correo y el identificador de cuenta no expira. También quiero mejorar la
carga de las imágenes para que navegar colecciones grandes se sienta más ágil.

Y, mirando un poco más lejos, hay ideas que podrían cambiar la forma de usar la
app: reconocer una carta con la cámara, armar mazos con las cartas propias,
coordinar intercambios entre coleccionistas o traer una colección desde otra
plataforma.

## 🤝 Estado y contribuciones

PKollector sigue creciendo, así que las sugerencias y contribuciones son más
que bienvenidas. Para cambios grandes, abre primero una conversación o un issue
y lo vemos.

## 📄 Licencia

Por ahora, el repositorio no incluye un archivo de licencia. Eso significa que
no hay que asumir que el código se puede redistribuir o reutilizar sin permiso.

## ⚠️ Aviso legal

PKollector es un proyecto de fans sin fines de lucro y no está afiliado,
patrocinado ni respaldado por Nintendo, Creatures, GAME FREAK o The Pokémon
Company.
