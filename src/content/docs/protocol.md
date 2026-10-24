---
title: Protocol schemas
description: Where troupe's JSON Schemas are published, and which URL to use for what.
status: written
prerelease: false
---

troupe's protocol is written as JSON Schema: the files troupe writes, the messages between troupe and the tools that
talk to it, and the contract a runner speaks. troupe.run publishes every schema at four kinds of URL. troupe itself
never fetches them: it carries its own copy.

## Which URL to use

- `/protocol/<path>`\
  Serves: the latest protocol release.\
  Use it for: reading the current schemas.
- `/protocol/<major>/<path>`, such as `/protocol/0/config/actor.schema.json`\
  Serves: the latest release with that major version.\
  Use it for: editors, and the `$schema` of files you write. After 1.0, only a new major version breaks it.
- `/protocol/<version>/<path>`, such as `/protocol/0.2.1/error.schema.json`\
  Serves: exactly that release.\
  Use it for: pinning one release.
- `/protocol/next/<path>`\
  Serves: troupe's unreleased `main`.\
  Use it for: trying a change before it's released.

Before 1.0, a minor release can break a schema, so `/protocol/0/` can change under you. Pin a version if that matters.

In each copy, every `$id` is that copy's own URL, so a reference inside a copy stays inside it.

## Releases

<!-- protocol:releases: the protocol releases, from troupe's protocol-v* tags. Its words are in src/content/copy/protocol.md. -->

## What each schema defines

troupe's [protocol README](https://github.com/troupe-run/troupe/blob/main/protocol/README.md) lists the schemas and the
rules every one follows. A schema is changed there, not here.
