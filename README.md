# AI-driven exploratory testing with Playwright MCP

[![Tests](https://github.com/lcdiaz87/practicaMCPPlaywright/actions/workflows/tests.yml/badge.svg)](https://github.com/lcdiaz87/practicaMCPPlaywright/actions/workflows/tests.yml)

**An AI agent explores real websites through the Playwright MCP server; what it finds becomes a Playwright Test + TypeScript suite.**

## English summary

**What this is.** A learning project to see what an AI agent (Claude Code) can do when it drives a real browser through [Playwright MCP](https://github.com/microsoft/playwright-mcp). Each exercise started as exploration with MCP tools (navigate, click, read the accessibility snapshot, inspect network and console) and ended as a regular Playwright test, organised with the Page Object Model and run on every push by GitHub Actions. 45 tests against two public practice sites:

| Part | Site | Tests | Deterministic? |
|---|---|---|---|
| E2E, accessibility, responsive, security | [saucedemo.com](https://www.saucedemo.com) | 38 | No, it is a live site |
| Dialogs, uploads, drag and drop, hovers, tabs | [the-internet.herokuapp.com](https://the-internet.herokuapp.com) | 7 | No, it is a live site |

**What I found along the way.**

- **saucedemo's login never leaves the browser.** No request carries the password: the user list and `secret_sauce` are hard-coded in the JavaScript bundle, and the "session" is a plain cookie. Creating `session-username=standard_user` by hand opens the inventory without logging in. Both facts are documented as expected failures.
- **`problem_user` has six bugs**, the worst one blocking checkout: whatever you type in *Last Name* ends up in *First Name*, so the form never validates.
- **The error reporter ships with placeholder credentials** (`universe=UNIVERSE&token=TOKEN`). Every page load fires two requests that fail with 401: those are the console errors seen on every login.
- **Text contrast is excellent (8.41:1 to 16.26:1, WCAG AAA), but the site ignores dark mode**, and with Windows forced colours the menu, cart and sort icons almost disappear.
- **The MCP browser itself was not always reliable.** In several sessions it stopped reacting to clicks after a few interactions, while a clean browser never did. Every finding was re-checked in a clean Playwright browser before it was reported.
- **An expected-failure test can pass for the wrong reason.** Each `test.fail()` was run once without the marker to confirm it fails on the bug's own assertion, not on a typo in a selector.

**How to run it.**

```bash
npm install
npx playwright install chromium
npm run typecheck # tsc, Playwright does not type-check on its own
npm test          # 45 tests: 37 pass, 8 are expected failures (known bugs)
```

> The rest of this documentation is in Spanish.

---

## Qué hay aquí y de qué depende

Todos los tests se ejecutan contra **dos webs de terceros**: [saucedemo.com](https://www.saucedemo.com) y [the-internet.herokuapp.com](https://the-internet.herokuapp.com). Son webs de práctica pensadas para automatización, pero no son mías: si cambian un texto, un selector o se caen, **los tests fallan y el CI se pone rojo sin que este repositorio tenga ningún problema**. Si ves el CI en rojo, mira primero si la web responde.

Los tests no generan datos reales: la "compra" de saucedemo es ficticia y no sale del navegador.

---

## Cómo se hizo: de la exploración al test

Un **servidor MCP** (Model Context Protocol) es un programa que ofrece herramientas a un modelo de IA. El de Playwright arranca un navegador y expone funciones como `browser_navigate`, `browser_click` o `browser_snapshot`. El modelo no ejecuta código del navegador: elige qué herramienta usar y con qué argumentos, y el servidor hace el trabajo real.

```
 Yo ──► Claude Code ──JSON-RPC (stdio)──► servidor Playwright MCP ──► Playwright ──► Chromium
        (decide qué           ◄── resultado: código ejecutado, URL,
         herramienta usar)        consola y snapshot de accesibilidad
```

El modelo "ve" la página a través del **snapshot de accesibilidad**: el árbol de roles y nombres accesibles (`textbox "Username"`, `button "Login"`), el mismo que usa un lector de pantalla. Por eso los page objects usan sobre todo `getByRole`, con los roles y nombres vistos en el snapshot, y `getByTestId` solo donde el snapshot no da un rol (precios, nombres de producto).

Cada ejercicio siguió el mismo ciclo:

1. **Explorar** con herramientas MCP: navegar, rellenar, leer el snapshot, inspeccionar red y consola.
2. **Verificar** lo encontrado, en un navegador limpio si el resultado no cuadraba.
3. **Convertirlo en test** con los selectores vistos en el snapshot.
4. **Comprobar que el test puede fallar**, no solo que pasa.

Las herramientas MCP usadas: `browser_navigate`, `browser_click`, `browser_type`, `browser_fill_form`, `browser_press_key`, `browser_select_option`, `browser_hover`, `browser_drag`, `browser_file_upload`, `browser_handle_dialog`, `browser_tabs`, `browser_wait_for`, `browser_snapshot`, `browser_find`, `browser_take_screenshot`, `browser_resize`, `browser_emulate_media`, `browser_evaluate`, `browser_console_messages`, `browser_network_requests`, `browser_network_request`, `browser_run_code_unsafe` y `browser_close`.

---

## Estructura: Page Object Model

Los tests de saucedemo no contienen selectores de la interfaz: cada página tiene su clase en [`pages/`](pages/) con sus localizadores y acciones, y los tests la reciben como fixture de Playwright.

```ts
test('compra completa de dos productos', async ({ loginPage, header, inventoryPage, cartPage, ... }) => {
  await loginPage.loginAs('standard_user');

  await inventoryPage.addToCart('Sauce Labs Backpack');
  await inventoryPage.addToCart('Sauce Labs Bike Light');
  await expect(header.cartButton).toHaveAccessibleName('Cart, 2 items');
  await header.openCart();
```

| Page object | Qué representa |
|---|---|
| `LoginPage` | Formulario de login, mensaje de error y `loginAs()` |
| `Header` | Menú lateral, Logout y carrito, comunes a todas las páginas tras el login |
| `InventoryPage` | Productos, ordenación, añadir y quitar del carrito |
| `CartPage` | Productos del carrito y botón Checkout |
| `CheckoutInformationPage` | Paso 1 del checkout: datos de envío |
| `CheckoutOverviewPage` | Paso 2: subtotal, impuesto y total |
| `CheckoutCompletePage` | Confirmación del pedido |

Dos decisiones:

- **Los botones "Add to cart" se llaman igual en los 6 productos**, así que `InventoryPage` localiza cada uno dentro de la tarjeta que contiene "View details for &lt;producto&gt;". Así los tests hablan de productos por su nombre, no de identificadores internos.
- **`the-internet.spec.ts` no usa page objects:** tiene un test por página, y una clase por cada una añadiría código sin quitar repetición.

---

## Qué cubren los tests

| Archivo | Qué prueba | Tests |
|---|---|---|
| [`login-roles.spec.ts`](tests/login-roles.spec.ts) | Login correcto, contraseña incorrecta, campos vacíos, contraseña vacía y usuario bloqueado, con el mensaje exacto de cada caso | 5 |
| [`login-keyboard.spec.ts`](tests/login-keyboard.spec.ts) | Login solo con teclado: orden de tabulación, envío con Enter y con Espacio sobre el botón | 2 |
| [`logout.spec.ts`](tests/logout.spec.ts) | Logout borra la sesión; ni el botón Atrás ni la URL directa devuelven al inventario | 3 |
| [`inventory-sort.spec.ts`](tests/inventory-sort.spec.ts) | Ordenar por precio y comprobar el orden completo | 1 |
| [`checkout.spec.ts`](tests/checkout.spec.ts) | Compra de dos productos, con subtotal, impuesto (8 %) y total | 1 |
| [`problem-user.spec.ts`](tests/problem-user.spec.ts) | El mismo flujo con `standard_user` y `problem_user`; los bugs del segundo, como fallos esperados | 12 |
| [`responsive.spec.ts`](tests/responsive.spec.ts) | Móvil (375×667) y escritorio (1280×800): sin scroll horizontal, 1 o 2 columnas, menú, ordenación y carrito | 8 |
| [`contrast.spec.ts`](tests/contrast.spec.ts) | Contraste WCAG AA de **todos** los textos visibles del login, el error y el inventario | 3 |
| [`security.spec.ts`](tests/security.spec.ts) | Cookie de sesión falsificada y contraseña en el código del navegador | 3 |
| [`the-internet.spec.ts`](tests/the-internet.spec.ts) | Alertas (aceptar, rechazar, prompt), subida de archivos, drag and drop, hovers y pestañas | 7 |

---

## Hallazgos

### Seguridad: el login ocurre entero en el navegador

Con `browser_network_requests` se ve que pulsar *Login* solo dispara 6 `GET` de imágenes: **no hay ninguna petición con la contraseña**. La comprobación está en el bundle de JavaScript que descarga cualquier visitante:

```js
ba = ['standard_user', 'locked_out_user', 'problem_user', 'performance_glitch_user', 'error_user', 'visual_user'];
function Ca(e, t) { return t === 'secret_sauce' ? ba.includes(e) : false }
```

La sesión es una cookie `session-username` con el nombre de usuario en texto plano. Crearla a mano da acceso al inventario sin contraseña; con un usuario que no está en la lista, no.

Es intencionado (saucedemo es un sitio de práctica), pero en una aplicación real serían tres fallos graves: credenciales en el cliente, una sesión que cualquiera puede falsificar y el control de acceso en el navegador en vez de en el servidor. `security.spec.ts` lo deja documentado.

### `problem_user`: seis bugs

Comparando el mismo flujo con `standard_user`:

| Dónde | Qué pasa con `problem_user` | Gravedad |
|---|---|---|
| Checkout | Lo que se escribe en *Last Name* acaba en *First Name* | Crítica |
| Checkout | Por lo anterior, la compra no se puede terminar | Crítica |
| Inventario | *Add to cart* no funciona en 3 de los 6 productos | Alta |
| Inventario | *Remove* no hace nada | Alta |
| Inventario | La ordenación no cambia el orden | Media |
| Inventario | Las 6 imágenes son la misma (`sl-404.jpg`) | Media |

### Configuración: el reporte de errores no funciona

Cada carga de página envía dos `POST` a `events.backtrace.io` con `universe=UNIVERSE&token=TOKEN`, valores de ejemplo que nunca se sustituyeron. Fallan con 401 y son los errores de consola que aparecen en cada login. Los cuerpos solo llevan telemetría del navegador, no credenciales.

### Accesibilidad y responsive

- **Contraste de texto muy bueno:** entre 8,41:1 y 16,26:1 (AAA).
- **El modo oscuro y `prefers-contrast` se ignoran:** el CSS no tiene ninguna regla para ellos. No es un bug, es una funcionalidad que no existe, así que no tiene test.
- **Con colores forzados (contraste alto de Windows) los iconos casi desaparecen:** el menú, el carrito y el filtro son imágenes que el navegador no recolorea. Está documentado aquí y no en un test, porque medirlo exigiría comparar píxeles, y eso da falsos fallos.
- **En móvil funciona todo, pero:** cada tarjeta mide 765 px de alto, la página ocupa unas 8 pantallas, el selector de orden pierde su texto y el botón del menú (20×20 px) queda por debajo de los 44×44 px recomendados para pantallas táctiles.
- **Abrir una URL interna directamente devuelve HTTP 404**, aunque la aplicación se recupera y pinta la página.

---

## Bugs documentados con `test.fail()`

Los tests describen lo que **debería** pasar. Cuando un bug lo impide, el test se marca con `test.fail()`:

- si el test falla, Playwright lo cuenta como correcto (fallo esperado) y la suite sigue en verde;
- si el bug se corrige y el test pasa, Playwright lo marca como error, y así te enteras de que hay que quitar la marca.

Hay 8: los 6 de `problem_user` y 2 de seguridad.

---

## Lo que aprendí trabajando con un agente de IA

**Hay que verificar lo que dice, sobre todo cuando no cuadra.** El navegador del MCP dejó de responder a los clics en varias sesiones, hasta el punto de que el login de `standard_user` fallaba. Los tests en un navegador limpio pasaban, así que el problema era el navegador del MCP y no la web. Si se hubiera reportado tal cual, habría sido un bug inventado.

**Un test que siempre pasa puede estar roto.** El primer test de contraste marcaba los enlaces sociales del pie: un falso positivo, porque su texto tiene `font-size: 0` y solo existe para lectores de pantalla. Una vez corregido, el test se validó con una copia temporal que ponía el logo en gris claro y comprobando que fallaba.

**Los fallos esperados también hay que comprobarlos.** Cada `test.fail()` se ejecutó una vez sin la marca para ver que fallaba en su propia aserción, con los valores del bug (1 imagen en vez de 6, "Diaz" en *First Name*...).

**El MCP tiene sus propias reglas:**

- Con un diálogo o un selector de archivos abierto entra en *modal state* y rechaza cualquier herramienta que no lo gestione.
- Solo sube archivos que estén dentro del proyecto (*allowed roots*), una medida para que el modelo no envíe cualquier archivo del equipo a una web.
- El snapshot no incluye lo que está oculto: el texto de un hover no aparece hasta que el ratón está encima.
- `browser_find` ahorra mucho en búsquedas concretas (12 líneas frente a 98 del snapshot completo), pero casi nada cuando lo buscado aparece por toda la página (88 frente a 98).
- El estado del navegador (`localStorage`) sobrevive a `browser_close` y se arrastra entre ejercicios.

---

## Comandos

| Comando | Qué hace | ¿Internet? |
|---|---|---|
| `npm run typecheck` | Comprobación de tipos con `tsc` | No |
| `npm test` | Los 45 tests en Chromium | **Sí** |
| `npx playwright test --headed` | Lo mismo, viendo el navegador | **Sí** |
| `npx playwright test --ui` | Modo interactivo para depurar | **Sí** |
| `npx playwright show-report` | Informe HTML de la última ejecución | No |

---

## Estado verificado

| Comprobación | Estado |
|---|---|
| `npm run typecheck` | ✅ Limpio |
| `npm test` | ✅ 45 tests: 37 pasan y 8 son fallos esperados |
| Cada `test.fail()`, ejecutado sin la marca | ✅ Falla en la aserción de su bug, también después del refactor a POM |
| El test de contraste con un color malo inyectado | ✅ Lo detecta |
| `typecheck` con un error de tipos inyectado | ✅ Lo detecta |

El workflow de [GitHub Actions](.github/workflows/tests.yml) hace lo mismo en cada push a `main` y en cada pull request: `npm ci`, `typecheck`, instala Chromium, ejecuta los tests y guarda el informe HTML como artefacto durante 14 días. En CI un `test.only` olvidado rompe el build, y cada test se reintenta hasta dos veces, porque depende de webs de terceros.

---

## Mapa del repositorio

```
pages/
  fixtures.ts               inyecta los page objects en cada test
  LoginPage.ts, Header.ts, InventoryPage.ts, CartPage.ts,
  CheckoutInformationPage.ts, CheckoutOverviewPage.ts, CheckoutCompletePage.ts
tests/
  login-roles.spec.ts       login y sus mensajes de error
  login-keyboard.spec.ts    login sin ratón
  logout.spec.ts            cierre de sesión y botón Atrás
  inventory-sort.spec.ts    ordenación por precio
  checkout.spec.ts          compra completa
  problem-user.spec.ts      bugs de problem_user
  responsive.spec.ts        móvil y escritorio
  contrast.spec.ts          contraste WCAG AA
  security.spec.ts          sesión y credenciales en el cliente
  the-internet.spec.ts      the-internet.herokuapp.com
  fixtures/upload.txt       archivo para el test de subida
.github/workflows/tests.yml CI: typecheck y tests en cada push
playwright.config.ts        baseURL, testIdAttribute: 'data-test', reintentos en CI
tsconfig.json               configuración de la comprobación de tipos
.mcp.json                   configuración del servidor Playwright MCP
```
