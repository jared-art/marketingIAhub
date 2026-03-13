# AdIntel — Plataforma de Análisis Publicitario

AdIntel es una plataforma full-stack para analizar y optimizar campañas publicitarias de Meta Ads, Google Ads y HubSpot. Genera insights automáticos cross-platform e identifica oportunidades de mejora.

## Stack tecnológico

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Backend:** Next.js API Routes (server-side)
- **Base de datos:** Supabase (PostgreSQL + Auth + RLS)
- **UI Components:** Radix UI, Recharts, Lucide React
- **Autenticación:** Supabase Auth con lista de usuarios permitidos

## Características principales

- Sistema de análisis multi-plataforma (Meta Ads, Google Ads, HubSpot)
- Motor de insights con 15+ reglas automáticas cross-platform
- Gauge de salud con puntuación 0-100
- Comparativa de ROAS, CPA y CTR entre plataformas
- Detección de discrepancias de atribución
- Plan de acción interactivo con checklist
- Sistema de roles (admin / analyst)
- Invitación de usuarios por email

## Prerrequisitos

- Node.js 18+
- npm 9+
- Cuenta en [Supabase](https://supabase.com) (gratuita)

## Configuración de Supabase

### 1. Crear proyecto

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. Guarda la URL y las claves API

### 2. Ejecutar la migración SQL

Abre el SQL Editor en tu proyecto Supabase y ejecuta el contenido de:

```
supabase/migrations/001_initial_schema.sql
```

Esto creará todas las tablas, tipos y políticas RLS necesarios.

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y rellena los valores:

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

Encuentra estas claves en: Supabase Dashboard → Settings → API

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Credenciales de plataformas

### Meta Ads — System User Token

1. Ve a [Meta Business Manager](https://business.facebook.com)
2. Navega a: Configuración → Usuarios → Usuarios del sistema
3. Crea un nuevo System User o usa uno existente
4. Genera un token con permisos: `ads_read`, `ads_management`, `business_management`
5. Asegúrate de que el System User tiene acceso a las cuentas publicitarias

### Google Ads — OAuth Credentials

Necesitas 5 credenciales:

1. **Developer Token:** [Google Ads API Center](https://developers.google.com/google-ads/api/docs/get-started/dev-token)
2. **Client ID y Client Secret:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client
3. **Refresh Token:** Usa el [OAuth Playground](https://developers.google.com/oauthplayground) con el scope `https://www.googleapis.com/auth/adwords`
4. **Customer ID:** El ID de la cuenta de Google Ads (formato: 123-456-7890)
5. **Manager Account ID** (opcional): Si usas una cuenta MCC (Manager)

### HubSpot — Private App Token

1. Ve a [HubSpot](https://app.hubspot.com)
2. Navega a: Settings → Integrations → Private Apps
3. Crea una nueva Private App
4. Permisos requeridos:
   - `crm.objects.contacts.read`
   - `crm.objects.deals.read`
   - `account-info.security.read`
5. Copia el token generado

## Configurar primer usuario administrador

Después de crear tu cuenta en Supabase Auth, necesitas añadirte manualmente como admin:

1. Ve a Supabase Dashboard → Authentication → Users
2. Copia tu User ID (UUID)
3. Abre el SQL Editor y ejecuta:

```sql
INSERT INTO public.allowed_users (email, role, auth_user_id, activated_at)
VALUES ('tu@email.com', 'admin', 'tu-user-id-uuid', NOW());
```

4. Ahora puedes iniciar sesión en AdIntel y gestionar otros usuarios desde `/admin`

## Despliegue en Vercel

1. Push del código a GitHub
2. Importa el repositorio en [Vercel](https://vercel.com)
3. Configura las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

### Configuración adicional en Supabase para producción

En Supabase → Authentication → URL Configuration:
- **Site URL:** `https://tu-dominio.vercel.app`
- **Redirect URLs:** `https://tu-dominio.vercel.app/**`

## Estructura del proyecto

```
/
├── app/                       # Next.js App Router
│   ├── login/                 # Página de inicio de sesión
│   ├── access-denied/         # Página de acceso denegado
│   ├── dashboard/             # Lista de análisis
│   ├── analyses/
│   │   ├── new/               # Wizard de nuevo análisis
│   │   └── [id]/              # Detalle del análisis
│   ├── admin/                 # Panel de administración
│   └── api/                   # API Routes
│       ├── platforms/         # Verificación de plataformas
│       ├── analyses/[id]/run/ # Ejecutar análisis
│       └── admin/             # Gestión de usuarios
├── components/                # Componentes React
│   ├── dashboard/             # Componentes del dashboard
│   ├── analyses/              # Wizard y conectores
│   ├── detail/                # Detalle del análisis
│   │   └── charts/            # Gráficos Recharts
│   └── admin/                 # Gestión de usuarios
├── lib/
│   ├── supabase/              # Clientes de Supabase
│   ├── api/                   # Integraciones con APIs externas
│   ├── insights/              # Motor de insights
│   └── utils/                 # Utilidades y formatters
├── types/                     # TypeScript types
├── supabase/
│   └── migrations/            # SQL de migración
└── middleware.ts              # Protección de rutas
```

## Arquitectura de seguridad

- **Row Level Security (RLS):** Activado en todas las tablas
- **Credenciales:** Almacenadas en servidor, nunca expuestas al cliente
- **Middleware:** Verifica sesión y lista de usuarios permitidos en cada request
- **Service Role:** Solo usado en API routes del servidor
