# Showtime

TV-show dashboard above [TVmaze API](https://www.tvmaze.com/api). It groups shows by genre, sorts each row by rating, and lets you search,
browse a genre in full, and open show's details.

## Prerequisites

* pnpm >= 11
* node >= 22.14
* one big TV set

> All dependencies are lock via `--save-exact` for security reasons. npm registry has been under attacks since July 2025
> and prefer to check them by scans. Also, `minimumReleaseAge` of pnpm is set to 10 days.

### Linter
This project uses [Eslint Stylistic](https://eslint.style/) for code formatting, validation, and linting. Enable an on-save mode
for [Jetbrains IDEs](https://www.jetbrains.com/help/webstorm/eslint.html#ws_eslint_configure_run_eslint_on_save).

### Autolint for VSC
1. Go to **File > Preferences > Settings** (or **Code > Preferences > Settings**).
2. Click `Workspace` and search for `Code Actions On Save`.
3. Edit in settings.json:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["javascript", "typescript", "vue"]
 }
```

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit 
pnpm test:unit:ui # interactive with coverage
```

### Run e2e Tests with [Playwright](https://playwright.dev/docs/intro)

```sh
pnpm test:e2e 
pnpm test:e2e:browser # browser
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
pnpm lint:fix
```

### Typechecking

```sh
pnpm typecheck
```

### Creating release with [changelogen](https://github.com/unjs/changelogen)

```sh
pnpm release
```

----

## Architectural choices

### Frontend

The application is built with Vue + Pinia + i18n. The main idea was to accumulate as less complex logic on the frontend 
side as possible. All components were split by their purpose having generic (layout and UI) and most specific (search, genre, show).
All components and function were covered with tests, both unit and e2e.

Pinia works as a state and request layer saving all screen work results when interacting with screens and before calling
the backend.

i18n removes all texts from Vue templates and keeps them in a dictionary which can be easily expanded with other languages.
It follows a set of rules making each line easy to read and understand the purpose. All repeatable lines also can be 
modified in one place and used in multiple ones.

I specified all types/interfaces in a special folder `Models` accessible both on frontend and backend sides. It's really
hard to maintain the code when pure Typescript constructions are stored with business logic.

Icons used are [Lucide](https://icones.js.org/collection/lucide) and set via `icons` utility without installation of
bulky Iconify (I didn't want to deal with the bundle size, it could be big).

### Backend

In the beginning, I wanted to make the backend part with Pinia having and processing all requests there. After a couple of days, I decided
that it would be too much for one side. Pinia is a headless Vue component, so I started thinking how to go to add the backend.

My first idea to include a simple h3 server and run everything within a monorepo. But it was too isolated for my test,
so I moved to Nitro.js which provided a server layer and worked as a Vite plugin. Nitro supports multiple KV storage drivers,
and I chose FS (fsLite). For the demonstration purposes all data is being saved in `.data` folder.

TVMaze API brought a real challenge with genres which required to remember about rate limiting. This became the main reason
why Nitro appeared. At the same time, I don't trust a lot to claims about CORS by other developers and prefer to use a proxy layer
if possible.

The server layer 4 utility files with `tvmaze.ts` as main collecting all necessary requests.

----

## Commit and branch notation

The project follows the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/). Possible commit messages:
1. feat
2. fix
3. refactor
3. chore or chore(\<type\>)
4. docs

```
feat: the change that breaks
```

The branch notation + commit message:
1. feature (feat, refactor, chore, docs)
2. bugfix (fix)
3. hotfix (fix)

A branch name should have short information about the change in case being found later if needed:

```
feature/the-change-that-breaks
```

## Locales

All texts are store in the `locales` folder with a default language setting.
Before adding keys:

1. We need to be sure that a needed text does or does not exist in the file
2. We need to think twice before adding the text.
3. A key case convention is **camelCase**
4. Same text variants should be grouped by an object (id, amount, type, etc.)

```json
{
  "code": {
    "show": "Show",
    "episode": "Episode | Episodes",
    "series": "Series",
    "year": "Year | Years"
  }
}
```

The main principle is **"If we have one word at the end of the string in multiple keys and it is repetitive, those keys
should be combined**. With this example, if a developer needs a code key, they can find it in such a generic object.

5. Text variants are grouped if there are 3+ keys. If you find a specific key that is dedicated or could be dedicated
   to another group, you should move it there.

```json
{
  "show": {
    "name": "Show",
    /* there should be the ID key, but it's gone to the ID group */
    "status": "Status"
  }
}
```

This rule also works if a key length is too long or can be collected in an object.

6. Key paths should be sentence-like and easily readable (e.g, `show.name`, `id.show`)
7. All translations should be alphabetically sorted before the push to avoid any conflicts.
