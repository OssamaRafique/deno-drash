/// @doc-blocks-to-json members-only

/**
 * @memberof Drash.Util.Exports
 * @interface ColorizeOptions
 *
 * @description
 *     A util function that helps colorize text in the console.
 */
export interface ColorizeOptions {
  color?: string,
  background?: string,
  style?: string
}

/**
 * @memberof Drash.Util.Exports
 * @function colorize
 *
 * @description
 *     A util function that helps colorize text in the console.
 *
 * @param string message
 * @param ColorizeOptions options
 *
 * @return string
 *     Returns the colorized message.
 */
export function colorize(message: string, options: ColorizeOptions): string {
  /* eslint key-spacing: ["off"] */
  // Foreground colors
  let colors = {
    black:   '\x1b[30m',
    red:     '\x1b[31m',
    green:   '\x1b[32m',
    yellow:  '\x1b[33m',
    blue:    '\x1b[34m',
    magenta: '\x1b[35m',
    cyan:    '\x1b[36m',
    white:   '\x1b[37m',
    default: '\x1b[39m',
  };

  // Background colors
  let backgrounds = {
    black:   '\x1b[40m',
    red:     '\x1b[41m',
    green:   '\x1b[42m',
    yellow:  '\x1b[43m',
    blue:    '\x1b[44m',
    magenta: '\x1b[45m',
    cyan:    '\x1b[46m',
    white:   '\x1b[47m',
    default: '\x1b[49m',
  };

  // Attributes
  let attributes = {
    reset:      '\x1b[0m',
    bright:     '\x1b[1m',
    dim:        '\x1b[2m',
    standout:   '\x1b[3m',
    underscore: '\x1b[4m',
    blink:      '\x1b[5m',
    reverse:    '\x1b[7m',
    hidden:     '\x1b[8m',
  };

  // Add the color
  if (options['color'] && colors[options['color']]) {
    message = colors[options['color']] + message;
  }

  // Add the background
  if (options['background'] && backgrounds[options['background']]) {
    message = backgrounds[options['background']] + message;
  }

  // Add the attribute
  if (options['style'] && attributes[options['style']]) {
    message = attributes[options['style']] + message;
  }

  // Make sure to reset text color, background, and attributes.
  message = message + colors['default'] + backgrounds['default'] + attributes['reset'];

  return message;
};