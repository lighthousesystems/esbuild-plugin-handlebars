import * as fs from "fs/promises";

import * as handlebars from "handlebars";

import type { Plugin, OnLoadResult, PartialMessage, build } from "esbuild";

interface CacheData {
  data: OnLoadResult;
  modified: Date;
}

async function esbuildResolve(
  name: string,
  dirs: string[],
  esbuild: { build: typeof build }
): Promise<string | null> {
  let result: string | null = null;

  for (const dir of dirs) {
    try {
      await esbuild.build({
        stdin: {
          contents: `import ${JSON.stringify(name)}`,
          resolveDir: dir
        },
        write: false,
        bundle: true,
        plugins: [
          {
            name: "resolve",
            setup({ onLoad }) {
              onLoad({ filter: /.*/ }, (args) => {
                result = args.path;
                return { contents: "" };
              });
            }
          }
        ]
      });
    } catch (error) {}

    if (result) {
      return result;
    }
  }

  return null;
}

let foundHelpers: string[];
class ESBuildHandlebarsJSCompiler extends handlebars.JavaScriptCompiler {
  nameLookup(parent: string, name: string, type: string): string {
    if (type === "helper" && !foundHelpers.includes(name)) {
      foundHelpers.push(name);
    }

    return super.nameLookup(parent, name, type);
  }
}

export default function hbs(options: PluginOptions = {}): Plugin {
  const {
    filter = /\.(hbs|handlebars)$/i,
    additionalHelpers = {},
    precompileOptions = {}
  } = options;

  return {
    name: "handlebars",
    setup(build) {
      const fileCache = new Map<string, CacheData>();
      const hb = handlebars.create();
      hb.JavaScriptCompiler = ESBuildHandlebarsJSCompiler;

      build.onLoad({ filter }, async ({ path: filename }) => {
        if (fileCache.has(filename)) {
          const cachedFile = fileCache.get(filename) || {
            data: null,
            modified: new Date(0)
          };
          let cacheValid = true;

          try {
            // Check that mtime isn't more recent than when we cached the result
            if ((await fs.stat(filename)).mtime > cachedFile.modified) {
              cacheValid = false;
            }
          } catch {
            cacheValid = false;
          }

          if (cacheValid) {
            return cachedFile.data;
          } else {
            // Not valid, so can be deleted
            fileCache.delete(filename);
          }
        }

        const source = await fs.readFile(filename, "utf-8");

        //const foundHelpers: string[] = [];
        const knownHelpers = Object.keys(additionalHelpers).reduce((prev, helper) => {
          prev[helper] = true;
          return prev;
        }, {} as { [key: string]: boolean });

        // Compile options
        const compileOptions = {
          ...precompileOptions,
          knownHelpersOnly: true,
          knownHelpers
        };

        try {
          foundHelpers = [];
          const template = hb.precompile(source, compileOptions);

          const foundAndMatchedHelpers = foundHelpers.filter(
            (helper) => additionalHelpers[helper] !== undefined
          );

          const contents = [
            "import * as Handlebars from 'handlebars/runtime';",
            ...foundAndMatchedHelpers.map(
              (helper) => `import ${helper} from '${additionalHelpers[helper]}';`
            ),
            `Handlebars.registerHelper({${foundAndMatchedHelpers.join()}});`,
            `export default Handlebars.template(${template});`
          ].join("\n");

          return { contents };
        } catch (err) {
          const exception: handlebars.Exception = err as handlebars.Exception;
          const esBuildError: PartialMessage = { text: exception.message };

          return { errors: [esBuildError] };
        }
      });
    }
  };
}

export interface PluginOptions {
  filter?: RegExp;
  additionalHelpers?: { [key: string]: string };
  precompileOptions?: {};
}
