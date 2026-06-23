# Security Policy

## Supported versions

The latest published `0.x` release receives security fixes. Once `1.0.0` ships, the most
recent minor will be supported.

## Reporting a vulnerability

Please report security issues **privately** — do not open a public GitHub issue.

Email **opensource@simtabi.com** with:

- a description of the vulnerability and its impact,
- steps to reproduce or a proof of concept,
- affected version(s).

You can expect an acknowledgement within a few business days. We will work with you on a
fix and coordinate a disclosure timeline, and credit you in the release notes unless you
prefer to remain anonymous.

## Scope notes

Tabar runs in the browser and has no runtime dependencies. It does not make network
requests. It does read and write to `localStorage`/`sessionStorage` when persistence is
enabled; stored data is validated and clamped on read, but treat it like any other
client-side state. Reports about XSS, prototype pollution, or unsafe DOM/CSS handling are
especially welcome.
