---
exo__Class: Class
name: Asset
description: Base class for all manageable assets in the system
superClass: Thing
properties:
  - name
  - description
  - status
  - category
  - created_date
  - updated_date
---

# Asset

The Asset class represents any manageable entity in the Exocortex system. This is the base class that provides common properties and behaviors for all assets.

## Properties

- **name**: The display name of the asset
- **description**: Detailed description of the asset
- **status**: Current status (active, inactive, archived)
- **category**: Classification category
- **created_date**: When the asset was created
- **updated_date**: Last modification timestamp

## Usage

Assets can be created using the Create Asset Modal which provides dynamic form expansion based on the selected class and its properties.