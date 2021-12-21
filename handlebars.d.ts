declare namespace Handlebars {
  interface CompilerOptions {
    knownHelpers: { [key: string]: boolean };
  }

  export class JavaScriptCompiler {
    nameLookup(parent: string, name: string, type: string): string;

    options: CompilerOptions;
  }
}
