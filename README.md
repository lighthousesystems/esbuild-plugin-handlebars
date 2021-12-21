[![latest version](https://img.shields.io/npm/v/@lighthousesystems/esbuild-plugin-handlebars)](https://www.npmjs.com/package/@lighthousesystems/esbuild-plugin-handlebars)

# esbuild-plugin-handlebars

A [handlebars](http://handlebarsjs.com) template precompiler for [esbuild](https://esbuild.github.io).

## Installation

`npm i esbuild-plugin-handlebars --save-dev`

## General Usage

### esbuild configuration

```javascript
import hbsPlugin from "esbuild-plugin-handlebars";

esbuild.build({
    entryPoints: ["index.ts"],
    ...
    plugins: [
        hbsPlugin({
            filter: /\.(hbs|handlebars)$/i,
            additionalHelpers: {
                toLowerCase: "templateHelpers/toLowerCase",
                translate: "templateHelpers/translate"
            },
            precompileOptions: {}
        })
    ]
});
```

### Your JS making use of the templates

```javascript
import template from "template.hbs";
// => returns template.hbs content as a template function
```

## Details

Helpers must be provided as options to the plugin.
It is unknown whether external partials work.

## Options

- filter: the filenames that will be processed by this plugin. Defaults to files with the extensions `.hbs` or `.handlebars`.
- additionalHelpers: the helpers that can be used in templates.
- precompileOptions: options passed into the `hb.precompile()` call.

## Change Log

See the [CHANGELOG.md](https://github.com/lighthousesystems/esbuild-plugin-handlebars/blob/master/CHANGELOG.md) file.

## License

MIT (http://www.opensource.org/licenses/mit-license)
