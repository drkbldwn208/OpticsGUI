Paraxial Optics Testbench
=========================

A standalone browser app for laying out paraxial optical systems, tracing rays, and inspecting ABCD matrices.

Open `index.html` in a browser. No build step or server is required.

Included tools:

- Interactive optical bench with SVG ray tracing.
- Rail-style component positioning with exact start-z, gap-before/gap-after fields, nudge controls, and bench dragging for optical elements.
- On-bench quick inspector beside the selected optic for local movement controls and key parameter edits.
- Standard and semi-exotic paraxial elements: free space, thin lens, asphere, cylindrical lens, thick lens, ball lens, spherical and plane interfaces, curved dielectric media, dielectric slab, aperture stop, screen, curved and flat mirrors, GRIN medium, afocal magnifier block, and custom ABCD matrix.
- Per-component inspector with editable physical parameters.
- Total and per-component ABCD matrix display.
- Cardinal metrics, spot size, optical path length, and live/clipped ray counts.
- Beam-check screens report centroid displacement, RMS spot size, beam diameter, angle RMS, Gaussian beam radius, waist location, waist size, and Rayleigh range.
- Gaussian beam q-parameter propagation.
- Fiber-to-asphere collimator widget from fiber MFD and wavelength, with deliberate defocus, output beam waist/radius, divergence, NA, Rayleigh range, target focal-length solve, and one-click bench insertion.
- One-variable design solver with selected-component handoff, target buttons, centered search ranges, live residuals, bounded parameter fitting, and custom targets for divergence, Rayleigh range, focus plane, screen height, and spot size at a chosen target plane.
- Presets for a camera relay, 4f relay, and beam expander.
- JSON import/export for saving bench setups.
