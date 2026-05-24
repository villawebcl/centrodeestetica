# Planificacion del proyecto

## Vision

Crear una web comercial reutilizable para centros de estetica, pensada como base adaptable para clientes reales del rubro. El proyecto debe comenzar con una landing simple y profesional, luego crecer hacia paginas internas, administracion de reservas/pagos y finalmente un bot con IA para responder consultas frecuentes.

## Cliente ficticio inicial

Nombre de marca: Lumina Estetica

Rubro: centro de estetica, cuidado facial, corporal y bienestar.

Publico objetivo:
- Mujeres y hombres de 25 a 55 anos.
- Personas que buscan tratamientos profesionales, agenda simple y confianza.
- Clientes que llegan desde Instagram, Google Maps, recomendaciones o WhatsApp.

Tono visual:
- Elegante, limpio y cercano.
- Profesional sin sentirse clinico frio.
- Paleta clara con acentos sobrios.
- Fotografias o bloques visuales que comuniquen cuidado, higiene y confianza.

## Objetivos comerciales

- Convertir visitas en consultas por WhatsApp o reservas.
- Mostrar servicios de forma clara.
- Transmitir confianza rapidamente.
- Preparar la base para escalar a agenda, pagos y automatizacion con IA.
- Mantener el sitio facil de adaptar para distintos clientes del rubro.

## Fase 1: Landing y paginas publicas

Alcance inicial:
- Home/landing principal.
- Pagina de servicios.
- Pagina de contacto.
- Pagina de promociones.
- Pagina de profesionales.
- Preguntas frecuentes.
- Politica de reservas.
- Pagina o seccion de promociones/testimonios.
- CTA visible hacia WhatsApp o reserva.
- Diseno responsive para mobile y desktop.

Secciones recomendadas en la home:
- Hero con nombre, propuesta de valor y CTA.
- Servicios destacados.
- Beneficios o razones para elegir el centro.
- Promocion o tratamiento destacado.
- Testimonios.
- Ubicacion/contacto.
- Footer con enlaces basicos.

Paginas publicas:
- `/`: landing principal.
- `/servicios`: listado de servicios y categorias.
- `/promociones`: planes y ofertas del mes.
- `/profesionales`: equipo y especialidades.
- `/preguntas-frecuentes`: dudas comunes y cuidados.
- `/politicas`: reglas de reservas, atrasos y reprogramaciones.
- `/contacto`: datos, formulario simple y mapa/ubicacion.

Resultado esperado:
- Sitio listo para mostrar a un cliente como maqueta comercial.
- Estructura reusable para cambiar marca, textos, servicios y colores.

## Fase 2: Administracion

Objetivo:
Agregar un apartado privado para gestionar operaciones del centro.

Estado actual:
- MVP inicial creado con almacenamiento local del navegador.
- Ruta publica de solicitud: `/reservar`.
- Ruta administrativa: `/admin`.
- Permite crear solicitudes de reserva, revisar metricas y cambiar estados.

Funcionalidades previstas:
- Login de administrador.
- Gestion de servicios.
- Gestion de profesionales.
- Toma de horas/reservas.
- Estados de reserva: pendiente, confirmada, cancelada, completada.
- Registro de clientes.
- Pagos o abonos.
- Panel de resumen diario/semanal.

Rutas tentativas:
- `/admin`: dashboard.
- `/admin/reservas`: agenda y lista de reservas.
- `/admin/clientes`: clientes.
- `/admin/servicios`: servicios configurables.
- `/admin/pagos`: pagos y abonos.

Notas tecnicas:
- Definir si se usara base de datos local, Supabase, Firebase u otra alternativa.
- Mantener separada la parte publica de la parte administrativa.
- No acoplar textos comerciales con logica de administracion.

## Fase 3: Bot IA de consultas frecuentes

Objetivo:
Automatizar respuestas frecuentes y capturar potenciales clientes.

Casos de uso:
- Horarios de atencion.
- Precios desde/listas de servicios.
- Duracion de tratamientos.
- Cuidados antes y despues.
- Ubicacion.
- Disponibilidad de agenda.
- Derivar a WhatsApp o reserva cuando corresponda.

Integraciones posibles:
- Widget web.
- WhatsApp Business.
- Base de conocimiento editable.
- OpenAI API para respuestas controladas.
- Registro de leads en panel admin.

Reglas del bot:
- Responder solo sobre informacion del centro.
- No diagnosticar condiciones medicas.
- Derivar a evaluacion profesional ante dudas delicadas.
- Pedir datos minimos solo cuando el usuario quiera agendar o recibir contacto.

## Principios de desarrollo

- Empezar simple y usable.
- Evitar dependencias innecesarias.
- Mantener componentes reutilizables.
- Centralizar datos editables: marca, servicios, contacto, testimonios.
- Cuidar mobile primero, porque muchos clientes llegaran desde redes sociales.
- Cada fase debe quedar funcional antes de avanzar a la siguiente.

## Principios de UI/UX comercial

- La primera pantalla debe comunicar valor, confianza y accion inmediata.
- Cada pagina debe tener un CTA claro hacia WhatsApp, contacto o reserva.
- La experiencia mobile es prioritaria para clientes que llegan desde Instagram o Google Maps.
- Los servicios deben mostrar informacion accionable: categoria, duracion, precio referencial y descripcion corta.
- La web debe ser facil de grabar en video: hero claro, scroll ordenado, bloques con mensajes vendibles y cierre en contacto.
- La propuesta debe mostrar crecimiento progresivo: landing, administracion, pagos y bot IA.

## Estructura inicial esperada

```text
src/
  components/
  data/
  layouts/
  pages/
  styles/
```

Datos configurables:
- `src/data/site.ts`: marca, contacto, redes, CTA.
- `src/data/services.ts`: servicios y precios referenciales.
- `src/data/testimonials.ts`: testimonios.

## Criterios de calidad

- El sitio debe cargar correctamente en mobile y desktop.
- Los CTA deben ser claros.
- Los textos deben poder adaptarse a otro centro sin reescribir componentes.
- La navegacion debe ser simple y consistente.
- El proyecto debe poder correr localmente con comandos npm.

## Roadmap inmediato

1. Crear estructura Astro.
2. Construir layout base y estilos globales.
3. Implementar home.
4. Implementar servicios.
5. Implementar contacto.
6. Verificar render local.
7. Ajustar responsive y detalles visuales.
