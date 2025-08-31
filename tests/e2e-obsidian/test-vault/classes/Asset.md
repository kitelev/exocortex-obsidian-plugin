---
exo__Class: exo__Asset
exo__ClassPrefix: Asset
exo__ClassDescription: "Base class for all assets in the knowledge system"
---

# Asset

Base class for all assets in the knowledge system.

## Properties

- **id**: Unique identifier for the asset
- **name**: Human-readable name of the asset
- **description**: Detailed description of the asset
- **created**: Creation timestamp
- **modified**: Last modification timestamp

## Relations

- **ems__contains**: Assets this asset contains
- **ems__containedBy**: Asset that contains this asset
- **rdfs__seeAlso**: Related assets