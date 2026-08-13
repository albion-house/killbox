# KILLBOX TERMINOLOGY GUIDE

## Locked-In Terms

The canonical player-facing terminology is:

- **Core**
- **Relay**
- **Boon**
- **Surge**

Use these terms consistently in current UI copy, objectives, tooltips, reward labels, mission text, design docs, and agent guidance.

### Arena
The fast, chaotic, escalating mode.

Arena is the power-fantasy survival loop.

Arena should feel like:

- Fast
- Chaotic
- Escalating
- Power-fantasy focused

### Expedition
The exploration and adventure mode.

Expedition should feel like:

- Exploration
- Discovery
- Resource management
- Risk and reward
- Adventure

Expedition alternates between exploration, combat waves, dungeons, and Relays.

### Core
The portable civilization engine.

- Carry the Core
- Deploy the Core
- Protect the Core
- Move the Core
- Connect the Core to a Relay

The Core is the heart of Expedition gameplay.

### Relay
A permanent network expansion point.

Relays are discovered throughout Expedition maps.

Connecting the Core to a Relay expands the network and advances progression.

Desired feeling:

> We found another Relay.

### Boon
A permanent upgrade choice.

Examples:

- Increased damage
- Faster reloads
- Improved tower range
- Additional projectiles

Meaning:
Choose a permanent upgrade.

Plural: **Boons**.

### Surge
A temporary high-power effect.

Examples:

- Bullet Hell
- Rocket Storm
- Double Fire Rate
- Infinite Ammo

Meaning:
Gain a temporary power boost.

Plural: **Surges**.

---

## Design Language

### Hearth
A design concept, not necessarily an in-world object.

Represents:

- Home
- Safety
- Civilization
- Territory

The Core functions as the player's Hearth.

### Network
The collection of active Relays connected through the Core.

Example messaging:

- Network Expanded
- Relay Online
- Network Stabilized

### Dungeon Archetype
A named shape for an Expedition level.

Examples:

- Pressure Cooker
- Fortress
- Exploration-focused
- Defense-focused
- Boss-focused

### Pressure Cooker
The current Expedition 01 dungeon archetype.

This means:

- Locked rooms
- Ambushes
- Core management
- Defensive play
- High tension

---

## Legacy Terms

- **Rift** is legacy terminology when it refers to the portable Expedition object. Use **Core** instead.
- **Powerup** is legacy terminology for a temporary high-power effect. Use **Surge** instead.
- Internal code identifiers may retain legacy names when renaming them would create unnecessary implementation risk. Player-facing language and current documentation should use the canonical terms.
- Do not mechanically replace every occurrence of the ordinary word "rift" if it refers to a literal anomaly, location, or unrelated world concept rather than the portable Core.

---

## Terms To Avoid

- Mutation
- Trial
- Sacred Flame
- Heartfire
- Altar
- Blessing
- Prophecy
- Chosen One
- Generic kingdom language
- Standard RPG lore

Killbox is moving toward strange technology, exploration, facilities, biomechanical systems, and network expansion rather than traditional fantasy.

---

## Naming Check

Before changing UI copy, docs, tooltips, objectives, HUD labels, reward labels, or mission text:

1. Portable civilization engine? **Core**
2. Permanent network installation point? **Relay**
3. Permanent run upgrade choice? **Boon**
4. Temporary high-power effect? **Surge**

## North Star Test

Does a new term feel like it belongs alongside:

- Arena
- Expedition
- Core
- Relay
- Boon
- Surge

If not, reconsider it.
