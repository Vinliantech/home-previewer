# Lillycrest Luxury Terrace — Life Camp

Drop the renders for this property straight into this folder. They are picked up
automatically: no code change, no import to add.

- **Accepted:** `.jpg`, `.jpeg`, `.png`, `.webp`
- **Order:** filenames are sorted naturally, so name them `01-…`, `02-…`, `03-…`
  to control the sequence. The **first** image is used as the cover on the
  properties grid and at the top of the detail page.
- **Empty is safe:** with no images here the property falls back to
  `src/assets/lillycrest-terrace.jpg` and the gallery section is hidden.

Suggested names for the five Life Camp renders:

```
01-street-view.jpg      # angled street elevation, terrace fronts
02-aerial-block.jpg     # aerial of the full terrace block and parking
03-front-elevation.jpg  # straight-on twin terrace elevation at dusk
04-aerial-parking.jpg   # aerial showing the parking bays and landscaping
05-corner-gate.jpg      # corner view with the estate gate and perimeter
```

Keep each file under ~400 KB where possible — these are shipped to every
visitor. Export at roughly 1600 px on the long edge.

The same pattern works for any other property: create
`src/assets/<property-slug>/`, add the folder to `src/lib/properties.ts` with
`loadGallery(import.meta.glob(...))`, and drop images in.
