# Fieldnote

Fieldnote is a small, browser-based electronic lab notebook for organizing experiment notes. It is an original MVP built around common lab notebook workflows; it is not affiliated with Scilligence.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create a production build, run `npm run build`; `npm run preview` serves that build locally.

## Use the notebook

- Browse all experiments, or narrow the list by status or notebook.
- Search experiment titles, tags, notebook names, and entry text.
- Create or edit an entry with an objective, materials, procedure, results, and conclusion. Set its notebook, status, and comma-separated tags.
- Create a notebook with **Add notebook** in the sidebar.

The starter workspace contains sample entries so the interface is useful on first launch. Changes are saved in the current browser's `localStorage`; they are not uploaded or synchronized to a server. Clearing browser storage removes local entries. This MVP does not provide regulated records, audit trails, validated electronic signatures, or compliance guarantees.
