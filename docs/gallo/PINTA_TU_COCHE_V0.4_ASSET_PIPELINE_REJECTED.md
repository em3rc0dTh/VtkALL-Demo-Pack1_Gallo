# Pinta tu coche — v0.4 asset pipeline rejection

Status: REJECTED / PAUSED
Branch: `feature/pinta-tu-coche-v1`
PR: #4

Runtime QA showed the v0.4 top-view automotive asset was corrupted in browser rendering. The semantic hit-map and workflow remained functional, but the visible raster asset displayed broken/blurred blocks and therefore failed acceptance.

Decision:
- do not merge PR #4;
- pause further visual experimentation;
- restore the last functional V3 viewer as the active renderer on the feature branch;
- keep all v0.4 files for lineage/evidence;
- resume only when high-fidelity vehicle assets and a verified binary asset pipeline are available;
- continue next with Mitos Landing as a separate workstream.

Frozen Pinta truth:
- workflow accepted;
- standalone route accepted;
- semantic zone contract accepted;
- vehicle visual renderer NOT accepted;
- Workshop/CRM integration remains locked for later.
