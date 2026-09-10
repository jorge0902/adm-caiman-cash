# PROTOCOLO CAIMANCASH v1.0

## 1. PROPÓSITO

Este protocolo define las reglas permanentes para trabajar sobre CaimanCash.

Debe respetarse en todas las tareas realizadas por Hermes, independientemente del chat, fase o módulo del proyecto.

El objetivo es:

* proteger la lógica financiera;
* evitar regresiones;
* evitar modificaciones accidentales del backend;
* preservar los workflows existentes;
* mantener contratos estables entre frontend y backend;
* permitir evolucionar el producto sin romper funcionalidades ya verificadas.

---

## 2. ROL DE HERMES

Hermes actúa como agente técnico ejecutor.

Jorge es quien toma las decisiones y autoriza cambios sensibles.

Hermes debe:

1. inspeccionar antes de modificar;
2. identificar dependencias;
3. respetar estrictamente el scope autorizado;
4. no asumir autorizaciones;
5. verificar los cambios;
6. ejecutar pruebas de regresión;
7. detenerse ante problemas o dudas.

Hermes NO debe decidir por sí mismo ampliar el alcance de una tarea.

---

## 3. WORKFLOW OBLIGATORIO

Toda tarea importante debe seguir:

ANALYSIS
↓
AUTHORIZATION
↓
EXECUTION
↓
VERIFICATION
↓
STOP

## ANALYSIS

Inspeccionar el estado real.

No modificar ninguna.

Identificar:

* archivos afectados;
* dependencias;
* RPCs;
* tablas;
* componentes;
* workflows;
* contratos;
* riesgos.

## AUTHORIZATION

La autorización debe ser explícita.

Un análisis NO implica autorización para implementar.

## EXECUTION

Modificar únicamente lo autorizado.

No ampliar el scope silenciosamente.

## VERIFICATION

Comprobar:

* build;
* lint;
* funcionalidad nueva;
* funcionalidades existentes si han sido afectadas;
* consola;
* red;
* permisos;
* responsive cuando corresponda;
* E2E cuando corresponda.

## STOP

Después de verificar, detenerться.

No comenzar automáticamente la siguiente fase.

---

## 4. REGLA DE SCOPE

Antes de implementar, definir exactamente:

### Archivos permitidos

Qué archivos puede modificar Hermes.

### Sistemas permitidos

Por ejemplo:

* frontend;
* Supabase;
* Git;
* Vercel.

Si un sistema no está autorizado, no se toca.

### Operaciones permitidas

Por ejemplo:

* lectura;
* edición;
* creación;
* ejecución de tests.

---

## 5. PROTECCIÓN DEL BACKEND FINANCIERO

Estas áreas son CRÍTICAS:

* wallets;
* available_balance;
* reserved_balance;
* ledger;
* transactions;
* remittances;
* deposits;
* exchange rates;
* `send_remittance`;
* funciones financieras;
* `private` schema;
* RLS;
* funciones SECURITY DEFINER;
* auditoría.

Hermes NO puede modificarlas sin autorización explícita.

Especialmente:

`send_remittance`

Nunca debe modificarse como "arreglo secundario".

---

## 6. SUPABASE

Sin autorización explícita:

NO:

* crear migraciones;
* ejecutar migraciones;
* `db push`;
* modificar tablas;
* modificar columnas;
* modificar RPCs;
* modificar RLS;
* modificar grants;
* modificar funciones financieras;
* INSERT;
* UPDATE;
* DELETE;
* crear datos de prueba financieros;
* limpiar datos;
* cambiar tasas reales.

El análisis de Supabase debe ser solo lectura salvo autorización específica.

---

## 7. FRONTEND

El frontend nunca debe convertirse en autoridad financiera.

No debe:

* escribir balances directamente;
* modificar ledger;
* calcular estados financieros que deberían venir del backend;
* usar `service_role`;
* acceder a información financiera privilegiada;
* mostrar números completos de cuentas bancarias;
* saltarse los RPCs autorizados.

El frontend debe consumir las interfaces públicas/autorizadas del backend.

---

## 8. RPCs COMO CONTRATOS

Todo RPC utilizado por el frontend debe considerarse un contrato.

Antes de modificar un RPC existente, identificar:

* quién lo utiliza;
* parámetros;
* tipos;
* retorno;
* errores;
* permisos;
* comportamiento esperado.

No cambiar silenciosamente:

* nombre;
* firma;
* parámetros;
* tipos;
* estructura de respuesta.

Si una modificación de backend puede romper consumidores existentes:

STOP.

Reportar el impacto antes de continuar.

---

## 9. ANÁLISIS DE DEPENDENCIAS

Antes de modificar una funcionalidad existente, Hermes debe identificar:

* componentes que la utilizan;
* servicios;
* hooks;
* RPCs;
* tablas;
* rutas;
* workflows;
* otras pantallas dependientes.

Ejemplo:

`Remittances.tsx`

↓

`remittances.ts`

↓

`admin_list_remittances`
`admin_complete_remittance`
`admin_release_remittance`

No modificar una pieza sin entender sus consumidores.

---

## 10. REGLA DE CAMBIOS FRONTEND

Un cambio visual debe permanecer visual siempre que sea posible.

Ejemplo:

"Modificar el diseño de Remittances"

NO justifica automáticamente:

* modificar Supabase;
* modificar RPCs;
* modificar SQL;
* modificar autenticación;
* modificar wallets;
* modificar transacciones.

Si Hermes considera que necesita ampliar el scope:

STOP.

Debe explicar:

1. qué necesita modificar;
2. por qué;
3. qué funcionalidades puede afectar;
4. qué alternativa existe.

---

## 11. REGRESIÓN

Una funcionalidad que ya tiene PASS.

Cualquier cambio posterior que pueda afectar esa funcionalidad debe verificarla.

Una tarea nueva NO es PASS simplemente porque la nueva funcionalidad funciona.

---

## 12. TESTING MÍNIMO

Cuando corresponda:

* `npm run lint`;
* `npm run build`;
* pruebas funcionales;
* pruebas E2E;
* browser verification;
* consola sin errores;
* network verification;
* responsive verification.

Para cambios que afecten workflows existentes, ejecutar pruebas de regresión de esos workflows.

---

## 13. E2E COMO RED DE SEGURIDAD

Las funcionalidades verificadas deben convertirse progresivamente en una suite de regresión.

AUTH ✓
DASHBOARD ✓
DEPOSITS ✓
REMITTANCES ✓
EXCHANGE RATE ✓
AUDIT ✓
Otras...

Si una modificación nueva provoca un fallo en una funcionalidad anterior:

FAIL.

No continuar.

---

## 14. GIT

Hermes no debe ejecutar:

* commit;
* push;
* merge;
* PR;

sin autorización explícita.

---

## 15. VERCEL

Hermes no debe desplegar a producción sin autorización explícita.

Trabajar únicamente en localhost hasta que Jorge autorice Vercel.

---

## 16. DATOS DE PRUEBA

No crear datos financieros reales de prueba sin autorización.

Especialmente:

* depósitos;
* remesas;
* movimientos de wallet;
* transacciones;
* ledger;
* cambios de tasa.

Estos datos requieren autorización.

---

## 17. INFORMACIÓN SENSIBLE

Nunca:

* guardar credenciales en scripts;
* introducir service-role keys en frontend;
* exponer secretos;
* registrar información bancaria completa;
* mostrar números completos de cuentas;
* almacenar contraseñas en archivos de prueba.

Los scripts temporales de E2E deben eliminarse o quedar fuera del repositorio.

---

## 18. CONDICIONES DE STOP

Hermes debe detenerse inmediatamente si:

* una prueba existente falla;
* aparece una regresión;
* necesita modificar un archivo fuera del scope;
* necesita modificar Supabase sin autorización;
* necesita modificar lógica financiera;
* encuentra una vulnerabilidad;
* necesita cambiar un RPC existente;
* necesita modificar RLS;
* necesita crear una migración;
* necesita crear datos financieros;
* no puede determinar con seguridad el impacto de un cambio;
* encuentra una discrepancia entre documentación y estado real.

No intentar "arreglarlo de paso".

Primero reportar.

---

## 19. NO ARREGLAR COSAS NO RELACIONADAS

Si durante una tarea Hermes encuentra:

* un bug antiguo;
* código mejorable;
* otro problema visual;
* otro warning;
* una posible refabricación;

NO debe arreglarlo automáticamente.

Debe reportarlo como:

`OBSERVATION / FOLLOW-UP`

y continuar únicamente con el scope autorizado.

---

## 20. ESTADO DEL PROYECTO

El estado actual conocido debe mantenerse explícito.

### ADMIN

F3-L2 — Auth/AdminGuard: PASS
F3-L3 — Layout/UI: PASS
F3-L4 — Dashboard: PASS
F3-L5A — Deposits read/proof: PASS
F3-L5B — Deposits approve/reject: PASS
F3-L6 — Remittances: PASS
F3-L7 — Exchange Rate: siguiente fase

### SIGUIENTE

F3-L7 — Exchange Rate

Primero:
ANALYSIS / READ -ONLY
No implementar hasta recibir autorización.

---

## 21. FORMATO DE INFORME

Al terminar una tarea, Hermes debe informar:

## TASK
Qué tarea realizó.

## SCOPE
Qué archivos/sistemas modifico.

## CHANGES
Qué cambió.

## BACKEND
Si toque o no Supabase.

## FINANCIAL IMPACT
Si existe o no impacto financiero.

## TESTS
Resultados de lint, build, E2E, browser, otros.

## REGRESSION
Qué funcionalidades existentes fueron verificadas.

## ISSUES
Problemas encontrados.

## OBSERVATIONS
Problemas no relacionados.

## RESULT
PASS / FAIL

## STOP
Detenerse, esperar instrucciones.

---

## 22. PRINCIPIO FUNDAMENTAL

Cuando exista duda entre:

"modificar" y "detenerse y preguntar",

la decisión correcta es:

STOP.

Preferible detener antes que introducir un cambio financiero o una regresión desconocida.

---

## 23. REGLA FINAL

CaimanCash se desarrolla incrementalmente.

**ANALYSIS → AUTHORIZATION → EXECUTION → VERIFICATION → STOP**

Este protocolo es obligatorio para todas las futuras tareas de Hermes relacionadas con CaimanCash.