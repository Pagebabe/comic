# Package v0.6 LoRA Snapshot

Last updated: 2026-07-05

## Route

```text
#/ricco-package
```

## Summary

Production packages now include a saved LoRA readiness snapshot.

Package version:

```text
ricco-production-package-v6
```

## New package section

```text
loraPlanState
```

It contains:

```text
snapshot
readyTargets
needsWorkTargets
totalApprovedItems
restoreSupported
```

The snapshot is derived from stored images and generation jobs.

No extra localStorage key is needed because the source metadata already lives on `RiccoPanelImage` objects.

## Package page

The package page now shows:

```text
LoRA ready targets
LoRA targets needing work
approved training items
```

It can also copy the LoRA plan snapshot separately.

## Tests

Updated tests cover:

```text
package version v6
loraPlanState in package
LoRA plan snapshot values
packageLooksLikeRiccoPackage detects loraPlanState
next steps route to LoRA plan when targets need work
```
