# Horario de Asistentes — Casino Atlántico Manatí

Plataforma web para la gestión de horarios, firmas digitales, solicitudes de
vacaciones/enfermedad y reporte de propinas (Slot Attendant Tip Report) del
Casino Atlántico Manatí.

## Funcionalidades

- **Login propio** con usuario/contraseña (sin dependencia de Claude u otros).
- **Firma digital** de horarios por empleado — queda registrado IP, user-agent y fecha.
- **Alertas de conflicto** cuando dos empleados tienen el mismo turno o almuerzo.
- Área de **break** que permite marcar vacaciones, enfermedad o tiempo personal.
- **Pop-up** automático al iniciar sesión para firmar horarios pendientes
  (más grande cuando el horario pertenece a la próxima semana).
- **Perfil del empleado**: balance de vacaciones/enfermedad, histórico de turnos,
  propinas y solicitudes.
- **Solicitudes PTO** con aprobación/rechazo por admin. Balance inicial asignado
  por admin + acumulación automática de **10h vacaciones + 8h enfermedad** por mes.
- **Slot Attendant Tip Report** replicando exactamente la hoja de Excel original:
  grilla semanal de horas, propinas diarias, cálculo de Propina/Hora, Pago
  Total/Hora y Total Propinas+Salario.
- **Paleta pastel** derivada del azul del logo; accesible (WCAG AA), responsive.

## Stack

- Next.js 15 (App Router) + TypeScript (strict)
- PostgreSQL + Prisma ORM
- Tailwind CSS + Radix UI primitives + Sonner (toasts) + Framer Motion
- Autenticación propia: bcryptjs + jose JWT (cookie httpOnly)
- Vitest (unit) + Zod (validación de inputs)

## Primeros pasos

```bash
# 1. Copia el env y completa
cp .env.example .env
# Genera AUTH_SECRET: openssl rand -base64 48

# 2. Instala dependencias
npm install

# 3. Corre migraciones + seed (crea admin inicial y empleados demo)
npx prisma migrate dev --name init
npm run db:seed

# 4. Coloca el logo
# Guarda el logo de Casino Atlántico Manatí como:
# public/logo-casino-atlantico.png

# 5. Arranca el dev server
npm run dev
```

Abre http://localhost:3000 y entra con el usuario admin definido en `.env`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Build de producción (corre `prisma generate`) |
| `npm start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unit) |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:seed` | Ejecuta `prisma/seed.ts` |

## Estructura

```
app/
  (auth)  login/                     # Página de login
  employee/                          # Área del empleado
    dashboard/                       # Resumen + pop-up de firma pendiente
    schedule/                        # Ver y firmar horarios
    profile/                         # Balances + propinas
    requests/                        # Solicitar PTO
  admin/                             # Área del administrador
    dashboard/                       # Alertas de conflicto
    schedules/                       # CRUD de turnos
    employees/                       # Usuarios + balances
    tips/                            # Slot Attendant Tip Report
    requests/                        # Aprobar/rechazar PTO
  api/
    auth/, schedules/, employees/,
    pto/, tips/, cron/accrue-pto/
components/
  ui/                                # Botón, input, dialog, select, etc.
  logo.tsx, app-header.tsx, toaster.tsx, user-menu.tsx
lib/
  auth.ts, db.ts, dates.ts,
  conflicts.ts, pto.ts, tips.ts,
  api.ts, utils.ts
prisma/
  schema.prisma, seed.ts
tests/
  conflicts.test.ts, pto.test.ts, tips.test.ts
```

## Lógica de propinas (replica del Excel)

```
tipPerHour   = totalTipWeek / totalHoursWeek
tipForEmp    = employeeHours * tipPerHour
payPerHour   = hourlyRate + tipPerHour
totalComp    = employeeHours * payPerHour
```

Ejemplo (semana del 20-Abr-2026, 7 empleados × 40h, propina lunes $720, rate $11.33):

- Total Horas = 280 · Total Tip = $720.00
- Propina/hora = $2.57
- Pago Total/hora = $13.90
- Por empleado = 40h → $102.86 en propinas → $556 en compensación total

Cubierto por los tests en `tests/tips.test.ts`.

## Despliegue

Vercel + Neon/Supabase:

1. Define en Vercel: `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`.
2. El cron de acumulación de PTO está declarado en `vercel.json`
   (`/api/cron/accrue-pto` el día 1 de cada mes).
3. Primer deploy ejecutará `prisma generate && next build`. Ejecuta
   `npx prisma migrate deploy` desde un workflow o localmente contra la DB
   de producción.

## Notas pendientes

- Reemplazar `public/logo-casino-atlantico.png` con el logo real.
- Configurar correo/SMS opcional (Resend/Twilio) — fuera de alcance actual.
- Exportación a PDF del Tip Report — fuera de alcance actual.
