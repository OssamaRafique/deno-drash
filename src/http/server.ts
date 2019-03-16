// namespace Drash.Http

import { serve } from "https://deno.land/x/http/server.ts";
import Drash from "../../mod.ts";
import DrashHttpResource from "../http/resource.ts";
import DrashHttpRequest from "../http/request.ts";

/**
 * @class Server
 * Server handles the entire request-resource-response lifecycle. It is in
 * charge of handling HTTP requests to resources, static paths, sending
 * appropriate responses, and handling any errors that bubble up within the
 * request-resource-response lifecycle.
 */
export default class Server {
  static REGEX_URI_MATCHES = new RegExp(/(:[^(/]+|{[^0-9][^}]*})/, "g");
  static REGEX_URI_REPLACEMENT = "([^/]+)";

  protected configs: any;
  protected deno_server;
  protected logger;
  protected resources: any = {};

  /**
   * This server's list of static paths. HTTP requests to a static path are
   * usually intended to retrieve some type of concrete resource (e.g., a CSS
   * file or a JS file). If an HTTP request is matched to a static path and the
   * resource the HTTP request is trying to get is found, then
   * `Drash.Http.Response` will use its `sendStatic()` method to send the static
   * asset back to the client.
   *
   * @property string[] static_paths
   */
  protected static_paths: string[] = [];
  protected trackers = {
    requested_favicon: false
  };

  // FILE MARKER: CONSTRUCTOR //////////////////////////////////////////////////

  /**
   * Construct an object of this class.
   *
   * @param any configs
   *     address: string
   *
   *     logger: Drash.Http.ConsoleLogger|Drash.Http.FileLogger
   *
   *     response_output: string (a proper MIME type)
   *
   *     resources: Drash.Http.Resource[]
   *
   *     static_paths: string[]
   */
  constructor(configs: any) {
    if (!configs.logger) {
      this.logger = new Drash.Loggers.ConsoleLogger({
        enabled: false
      });
    } else {
      this.logger = configs.logger;
    }

    if (!configs.address) {
      configs.address = "127.0.0.1:8000";
    }

    if (!configs.response_output) {
      configs.response_output = "application/json"
    }

    this.configs = configs;

    if (configs.resources) {
      configs.resources.forEach(resource => {
        this.addHttpResource(resource);
      });
      delete this.configs.resources;
    }

    if (configs.static_paths) {
      configs.static_paths.forEach(path => {
        this.addStaticPath(path);
      });
    }
  }

  // FILE MARKER: METHODS - PUBLIC /////////////////////////////////////////////

  /**
   * Handle an HTTP request from the Deno server.
   *
   * @param Drash.Http.Request request
   *     The request object.
   *
   * @return any
   *    See _Drash.Http.Response.send()_.
   */
  public handleHttpRequest(request: DrashHttpRequest): any {
    let getStaticPathAsset = this.requestIsForStaticPathAsset(request);
    let response;

    if (getStaticPathAsset) {
      try {
        response = new Drash.Http.Response(request);
        return response.sendStatic();
      } catch (error) {
        return this.handleHttpRequestError(
          request,
          new Drash.Exceptions.HttpException(404)
        );
      }
    }

    if (request.url == "/favicon.ico") {
      return this.handleHttpRequestForFavicon(request);
    }

    this.logger.info(
      `Request received: ${request.method.toUpperCase()} ${request.url}`
    );

    request = Drash.Services.HttpService.hydrateHttpRequest(request, {
      headers: {
        "Response-Content-Type-Default": this.configs.response_output
      }
    });

    let resourceClass = this.getResourceClass(request);

    // No resource? Send a 404 (Not Found) response.
    if (!resourceClass) {
      return this.handleHttpRequestError(
        request,
        new Drash.Exceptions.HttpException(404)
      );
    }

    // @ts-ignore
    // We ignore this because `resourceClass` could be `undefined` and that
    // doens't have a construct signature. If this isn't ignored, then the
    // following error will occur:
    //
    // TS2351: Cannot use 'new' with an expression whose type lacks a call or
    // construct signature.
    //
    let resource = new resourceClass(request, new Drash.Http.Response(request), this);

    try {
      this.logger.debug(
        `Calling ${
          resource.constructor.name
        }.${request.method.toUpperCase()}() method.`
      );
      response = resource[request.method.toUpperCase()]();
      this.logger.info(
        `Sending response. Content-Type: ${response.headers.get(
          "Content-Type"
        )}. Status: ${response.getStatusMessageFull()}.`
      );
      return response.send();
    } catch (error) {
      // If a resource was found, but an error occurred, then that's most likely
      // due to the HTTP method not being defined in the resource class;
      // therefore, the method is not allowed. In this case, we send a 405
      // (Method Not Allowed) response.
      if (resource && !error.code) {
        if (!response) {
          return this.handleHttpRequestError(
            request,
            new Drash.Exceptions.HttpException(405)
          );
        }
        return this.handleHttpRequestError(
          request,
          new Drash.Exceptions.HttpException(500)
        );
      }

      // All other errors go here
      return this.handleHttpRequestError(request, error);
    }
  }

  /**
   * Handle cases when an error is thrown when handling an HTTP request.
   *
   * @param Drash.Http.Request request
   *     The request object.
   * @param any error
   *     The error object.
   *
   * @return any
   *     See _Drash.Http.Response.send()_.
   */
  public handleHttpRequestError(request: DrashHttpRequest, error: any): any {
    this.logger.debug(
      `Error occurred while handling request: ${request.method} ${request.url}`
    );
    this.logger.trace("Stack trace below:");
    this.logger.trace(error.stack);

    let response = new Drash.Http.Response(request);

    switch (error.code) {
      case 401:
        error.code = 401;
        response.body = error.message
          ? error.message
          : `The requested URL '${request.url_path} requires authentication.`;
        break;
      case 404:
        response.body = error.message
          ? error.message
          : `The requested URL '${
              request.url_path
            }' was not found on this server.`;
        break;
      case 405:
        response.body = error.message
          ? error.message
          : `URI '${
              request.url_path
            }' does not allow ${request.method.toUpperCase()} requests.`; // eslint-disable-line
        break;
      case 500:
        response.body = error.message
          ? error.message
          : `Something went terribly wrong.`; // eslint-disable-line
        break;
      default:
        error.code = 400;
        response.body = error.message ? error.message : "Something went wrong.";
        break;
    }

    response.status_code = error.code;

    this.logger.info(
      `Sending response. Content-Type: ${response.headers.get(
        "Content-Type"
      )}. Status: ${response.getStatusMessageFull()}.`
    );

    return response.send();
  }

  /**
   * Handle HTTP requests for the favicon. This method only exists to
   * short-circuit favicon requests--preventing the requests from clogging the
   * logs.
   *
   * @param Drash.Http.Request request
   */
  public handleHttpRequestForFavicon(request: DrashHttpRequest): any {
    let headers = new Headers();
    headers.set("Content-Type", "image/x-icon");
    if (!this.trackers.requested_favicon) {
      this.trackers.requested_favicon = true;
      this.logger.debug("/favicon.ico requested.");
      this.logger.debug(
        "All future log messages for /favicon.ico will be muted."
      );
    }
    let response = {
      status: 200,
      headers: headers
    };
    request.respond(response);
    return JSON.stringify(response);
  }

  /**
   * Run the Deno server at the address specified in the configs. This method
   * takes each HTTP request and creates a new and more workable request object
   * and passes it to _Drash.Http.Server.handleHttpRequest()_.
   *
   * @return Promise<void>
   *     This method just listens for requests at the address you provide in the
   *     configs.
   */
  public async run(): Promise<void> {
    this.serverLog(`Deno server started at ${this.configs.address}.`);
    this.deno_server = serve(this.configs.address);
    for await (const request of this.deno_server) {
      let drashRequest = new Drash.Http.Request(request);
      this.handleHttpRequest(drashRequest);
    }
  }

  // FILE MARKER: METHODS - PROTECTED //////////////////////////////////////////

  /**
   * Add an HTTP resource to the server which can be retrieved at specific URIs.
   *
   * Drash defines an HTTP resource according to the [MDN web
   * docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Identifying_resources_on_the_Web).
   *
   * @param Drash.Http.Resource resourceClass
   *     A child object of the `Drash.Http.Resource` class.
   *
   * @return void
   *     This method just adds `resourceClass` to `this.resources` so it can be
   *     used (if matched) during an HTTP request.
   */
  protected addHttpResource(resourceClass: DrashHttpResource): void {
    resourceClass.paths.forEach((path, index) => {
      let pathObj;
      if (path == "*" || path.includes("*")) {
        pathObj = {
          og_path: path,
          regex_path:
            "^." +
            path.replace(
              Server.REGEX_URI_MATCHES,
              Server.REGEX_URI_REPLACEMENT
            ) +
            "$",
          params: (path.match(Server.REGEX_URI_MATCHES) || []).map(path => {
            return path
              .replace(":", "")
              .replace("{", "")
              .replace("}", "");
          })
        };
        return;
      }
      try {
        pathObj = {
          og_path: path,
          regex_path:
            "^" +
            path.replace(
              Server.REGEX_URI_MATCHES,
              Server.REGEX_URI_REPLACEMENT
            ) +
            "$",
          params: (path.match(Server.REGEX_URI_MATCHES) || []).map(path => {
            return path
              .replace(":", "")
              .replace("{", "")
              .replace("}", "");
          })
        };
        resourceClass.paths[index] = pathObj;
      } catch (error) {
        this.serverLog(error);
      }
    });

    // Store the resource so it can be retrieved when requested
    this.resources[resourceClass.name] = resourceClass;

    this.serverLog(`HTTP resource "${resourceClass.name}" added.`);
  }

  /**
   * Add a static path for serving static assets like CSS files, JS files, PDF
   * files, etc.
   *
   * @param string path
   *
   * @return void
   *     This method just adds `path` to `this.static_paths` so it can be used (if
   *     matched) during an HTTP request.
   */
  protected addStaticPath(path: string): void {
    this.static_paths.push(path);
  }

  /**
   * Get the resource class.
   *
   * @param Drash.Http.Request request
   *     The request object.
   *
   * @return Drash.Http.Resource|undefined
   *     Returns a `Drash.Http.Resource` object if the URL path of the request
   *     can be matched to a `Drash.Http.Resource` object's paths.
   *
   *     Returns `undefined` if a `Drash.Http.Resource` object can't be matched.
   */
  protected getResourceClass(request: DrashHttpRequest): DrashHttpResource|undefined {
    let matchedResourceClass = undefined;

    for (let className in this.resources) {
      // Break out if a resource was matched with the
      // request.parsed_url.pathname variable
      if (matchedResourceClass) {
        break;
      }

      let resource = this.resources[className];

      resource.paths.forEach(function getResourceClass_forEachPaths(
        pathObj,
        index
      ) {
        if (!matchedResourceClass) {
          let thisPathMatchesRequestPathname = null;
          if (pathObj.og_path === "/" && request.url_path === "/") {
            matchedResourceClass = resource;
            return;
          }

          // Check if the current path we're working on matches the request's
          // pathname
          thisPathMatchesRequestPathname = request.url_path.match(
            pathObj.regex_path
          );
          if (!thisPathMatchesRequestPathname) {
            return;
          }

          // Create the path params
          let requestPathnameParams = request.url_path.match(
            pathObj.regex_path
          );
          let pathParamsInKvpForm = {};
          try {
            requestPathnameParams.shift();
            pathObj.params.forEach(
              function closure_getResourceClass_forEach_params_forEach(
                paramName,
                index
              ) {
                pathParamsInKvpForm[paramName] = requestPathnameParams[index];
              }
            );
          } catch (error) {}
          request.path_params = pathParamsInKvpForm;

          // Store the matched resource
          matchedResourceClass = resource;
        }
      });
    }

    return matchedResourceClass;
  }

  /**
   * Is the request for a static path asset?
   *
   * @param Drash.Http.Request request
   *
   * @return boolean
   *     Returns true if the request is for an asset in a static path.
   */
  protected requestIsForStaticPathAsset(request) {
    // If the request URL is "/public/assets/js/bundle.js", then we take out
    // "/public" and use that to check against the static paths
    let requestUrl = `/${request.url.split("/")[1]}`;

    if (this.static_paths.indexOf(requestUrl) != -1) {
      request = Drash.Services.HttpService.hydrateHttpRequest(request, {
        headers: {
          "Response-Content-Type": Drash.Services.HttpService.getMimeType(
            request.url,
            true
          )
        }
      });
      return true;
    }

    return false;
  }

  /**
   * console.log() something.
   */
  protected serverLog(message: any) {
    console.log(`[Drash] ${message}`);
  }
}
