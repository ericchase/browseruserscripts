import { BunPlatform_Glob_Match } from '../../../src/lib/ericchase/BunPlatform_Glob_Match.js';
import { NODE_PATH } from '../../../src/lib/ericchase/NodePlatform.js';
import { Async_NodePlatform_File_Write_Text } from '../../../src/lib/ericchase/NodePlatform_File_Write_Text.js';
import { NodePlatform_PathObject_Relative_Class } from '../../../src/lib/ericchase/NodePlatform_PathObject_Relative_Class.js';
import { Builder } from '../../core/Builder.js';
import { Logger } from '../../core/Logger.js';
import { PATTERN } from '../../core/processor/Processor_TypeScript_Generic_Bundler.js';

/**
 * External pattern cannot contain more than one "*" wildcard.
 *
 * @defaults
 * @param config.define `undefined`
 * @param config.env `"disable"`
 * @param config.sourcemap `'none'`
 */
export function Processor_TypeScript_UserScript_Bundler(config?: Config): Builder.Processor {
  return new Class(config ?? {});
}
class Class implements Builder.Processor {
  ProcessorName = Processor_TypeScript_UserScript_Bundler.name;
  channel = Logger(this.ProcessorName).newChannel();

  bundle_set = new Set<Builder.File>();

  constructor(readonly config: Config) {
    this.config.env ??= 'disable';
    this.config.sourcemap ??= 'none';
  }
  async onAdd(files: Set<Builder.File>): Promise<void> {
    let trigger_reprocess = false;
    for (const file of files) {
      const query = file.src_path;
      if (BunPlatform_Glob_Match(query, `**/*{.user}${PATTERN.TS_TSX_JS_JSX}`)) {
        file.iswritable = true;
        file.out_path = NodePlatform_PathObject_Relative_Class(file.out_path).replaceExt('.js').join();
        file.addProcessor(this, this.onProcessUserScript);
        this.bundle_set.add(file);
        continue;
      }
      if (BunPlatform_Glob_Match(query, `**/*${PATTERN.TS_TSX_JS_JSX}`)) {
        file.iswritable = false;
        trigger_reprocess = true;
      }
    }
    if (trigger_reprocess === true) {
      for (const file of this.bundle_set) {
        file.refresh();
      }
    }
  }
  async onRemove(files: Set<Builder.File>): Promise<void> {
    let trigger_reprocess = false;
    for (const file of files) {
      const query = file.src_path;
      if (BunPlatform_Glob_Match(query, `**/*{.user}${PATTERN.TS_TSX_JS_JSX}`)) {
        this.bundle_set.delete(file);
        continue;
      }
      if (BunPlatform_Glob_Match(query, `**/*${PATTERN.TS_TSX_JS_JSX}`)) {
        trigger_reprocess = true;
      }
    }
    if (trigger_reprocess === true) {
      for (const file of this.bundle_set) {
        file.refresh();
      }
    }
  }

  async onProcessUserScript(file: Builder.File): Promise<void> {
    try {
      const results = await ProcessBuildResults(
        Bun.build({
          define: typeof this.config.define === 'function' ? this.config.define() : this.config.define,
          entrypoints: [file.src_path],
          env: this.config.env,
          format: 'esm',
          minify: {
            identifiers: false,
            syntax: false,
            whitespace: false,
          },
          sourcemap: this.config.sourcemap,
          target: 'browser',
          banner: await GetUserScriptHeader(file),
        }),
      );
      if (results.bundletext !== undefined) {
        // scan bundle text for source comment paths
        for (const [, ...paths] of results.bundletext.matchAll(/\n?\/\/ (src\/.*)\n?/g)) {
          for (const path of paths) {
            file.addUpstreamPath(path);
          }
        }
        file.setText(results.bundletext);
      }
      // process other artifacts
      for (const artifact of results.artifacts) {
        switch (artifact.kind) {
          case 'entry-point':
            // handled above
            break;
          default:
            await Async_NodePlatform_File_Write_Text(NODE_PATH.join(NODE_PATH.dirname(file.out_path), artifact.path), await artifact.blob.text(), true);
            break;
        }
      }
    } catch (error) {
      this.channel.error(error, 'Bundle Error');
    }
  }
}
type Options = Parameters<typeof Bun.build>[0];
interface Config {
  define?: Options['define'] | (() => Options['define']);
  env?: Options['env'];
  sourcemap?: Options['sourcemap'];
}

class BuildArtifact {
  blob: Blob;
  hash: string | null;
  kind: 'entry-point' | 'chunk' | 'asset' | 'sourcemap' | 'bytecode';
  loader: 'js' | 'jsx' | 'ts' | 'tsx' | 'json' | 'toml' | 'file' | 'napi' | 'wasm' | 'text' | 'css' | 'html';
  path: string;
  sourcemap: BuildArtifact | null;
  constructor(public artifact: Bun.BuildArtifact) {
    this.blob = artifact;
    this.hash = artifact.hash;
    this.kind = artifact.kind;
    this.loader = artifact.loader;
    this.path = artifact.path;
    this.sourcemap = artifact.sourcemap ? new BuildArtifact(artifact.sourcemap) : null;
  }
}
async function ProcessBuildResults(buildtask: Promise<Bun.BuildOutput>): Promise<{
  artifacts: BuildArtifact[];
  bundletext?: string;
  logs: Bun.BuildOutput['logs'];
  success: boolean;
}> {
  const buildresults = await buildtask;
  const out: {
    artifacts: BuildArtifact[];
    bundletext?: string;
    logs: Bun.BuildOutput['logs'];
    success: boolean;
  } = {
    artifacts: [],
    bundletext: undefined,
    logs: buildresults.logs,
    success: buildresults.success,
  };
  if (buildresults.success === true) {
    for (const artifact of buildresults.outputs) {
      switch (artifact.kind) {
        case 'entry-point': {
          out.bundletext = await artifact.text();
        }
      }
      out.artifacts.push(new BuildArtifact(artifact));
    }
  }
  return out;
}
async function GetUserScriptHeader(file: Builder.File) {
  const text = await file.getText();
  const start = text.match(/^\/\/.*?==UserScript==.*?$/dim);
  const end = text.match(/^\/\/.*?==\/UserScript==.*?$/dim);
  const header = text.slice(start?.indices?.[0][0] ?? 0, end?.indices?.[0][1] ?? 0);
  return `${header}\n`;
}
