# Shared Store

`lib/store.ts` is the simple V1 shared data layer for MT Coach.

It uses browser `localStorage` so the prototype can share MT, rombel, and session data across pages without adding a database yet.

Next step: migrate Data and Planning pages to use these helpers, then derive Monitoring, Performance, and Dashboard from the same data.