<p align="center">
  <img height="200" src="https://drashland.github.io/deno-drash-docs/public/assets/img/logo_drash.png" alt="Drash logo">
  <h1 align="center">Drash</h1>
</p>
<p align="center">A microframework for <a href="https://github.com/denoland/deno">Deno</a> focused on <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Identifying_resources_on_the_Web">resource</a> creation and <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation">content negotiation</a>.</p>
<p align="center">
  <a href="https://github.com/drashland/deno-drash/releases">
    <img src="https://img.shields.io/github/release/drashland/deno-drash.svg?color=bright_green&label=latest">
  </a>
  <a href="https://github.com/drashland/deno-drash/actions">
    <img src="https://img.shields.io/github/workflow/status/drashland/deno-drash/master?label=master">
  </a>
</p>

---

```typescript
// File: app.ts

import Drash from "https://deno.land/x/drash/mod.ts";

class HomeResource extends Drash.Http.Resource {
  static paths = ["/"];
  public GET() {
    this.response.body = "Hello World!";
    return this.response;
  }
}

const server = new Drash.Http.Server({
  address: "localhost:1337",
  response_output: "text/html",
  resources: [HomeResource]
});

server.run();
```

```
$ deno --allow-net app.ts
```

## Documentation

Full documentation: [https://drash.land](https://drash.land)

Repository: [deno-drash-docs](https://github.com/drashland/deno-drash-docs)

## Features

- Content Negotiation
- Static Path Routing
- Regex Path Routing (e.g., `/users/([0-9]+)/profile`)
- Middleware
- Request Params Parsing
    - Path Params (e.g., `/users/:id/profile`, `/users/{id}/profile`)
        - `request.getPathParam("id") == "value of :id or {id}"`
    - URL Query Params (e.g., `/products?name=beignet&action=purchase`)
        - `request.getQueryParam("name") == beignet`
    - Body Params Using application/x-www-form-urlencoded (e.g., `username=root&password=alpine`)
        - `request.getBodyParam("username") == "root"`
    - Body Params Using application/json (e.g., `{"username":"root","password":"alpine"}`)
        - `request.getBodyParam("password") == "alpine"`
    - Header Params (e.g., `{"Some-Header":"Some Value"}`)
        - `request.getHeaderParam("Some-Header") == "Some Value"`
        - ... or the default way (`request.headers.get("Some-Header") == "Some Value"`)

## Contributing

Contributors are welcomed!