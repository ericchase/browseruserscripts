import { Path } from '../src/lib/ericchase/Platform/FilePath.js';
import { Logger } from '../src/lib/ericchase/Utility/Logger.js';
import { BuilderInternal, ProcessorModule, ProjectFile } from './lib/Builder.js';
import { ts_tsx_js_jsx } from './lib/processors/TypeScript-GenericBundler.js';

const logger = Logger(Processor_UserscriptBundler.name);

type BuildConfig = Pick<Parameters<typeof Bun.build>[0], 'define' | 'sourcemap'>;

// External pattern cannot contain more than one "*" wildcard.
export function Processor_UserscriptBundler({ define = {}, sourcemap = 'linked' }: BuildConfig): ProcessorModule {
  return new CProcessor_UserscriptBundler({ define, sourcemap });
}

class CProcessor_UserscriptBundler implements ProcessorModule {
  channel = logger.newChannel();

  bundlefile_set = new Set<ProjectFile>();

  constructor(readonly config: Required<BuildConfig>) {}
  async onAdd(builder: BuilderInternal, files: Set<ProjectFile>): Promise<void> {
    let trigger_reprocess = false;
    for (const file of files) {
      if (builder.platform.Utility.globMatch(file.src_path.standard, `**/*{.user}${ts_tsx_js_jsx}`)) {
        file.out_path.ext = '.js';
        file.addProcessor(this, this.onProcess);
        this.bundlefile_set.add(file);
      } else if (builder.platform.Utility.globMatch(file.src_path.standard, `**/*${ts_tsx_js_jsx}`)) {
        trigger_reprocess = true;
      }
    }
    if (trigger_reprocess === true) {
      for (const file of this.bundlefile_set) {
        builder.reprocessFile(file);
      }
    }
  }
  async onRemove(builder: BuilderInternal, files: Set<ProjectFile>): Promise<void> {
    let trigger_reprocess = false;
    for (const file of files) {
      if (builder.platform.Utility.globMatch(file.src_path.standard, `**/*{.user}${ts_tsx_js_jsx}`)) {
        this.bundlefile_set.delete(file);
      } else if (builder.platform.Utility.globMatch(file.src_path.standard, `**/*${ts_tsx_js_jsx}`)) {
        trigger_reprocess = true;
      }
    }
    if (trigger_reprocess === true) {
      for (const file of this.bundlefile_set) {
        builder.reprocessFile(file);
      }
    }
  }

  async onProcess(builder: BuilderInternal, file: ProjectFile): Promise<void> {
    try {
      const results = await Bun.build({
        define: this.config.define,
        entrypoints: [file.src_path.raw],
        external: [],
        format: 'esm',
        minify: {
          identifiers: false,
          syntax: false,
          whitespace: false,
        },
        sourcemap: this.config.sourcemap,
        target: 'browser',
        // TODO: add userscript header
        banner: await getUserscriptHeader(file),
      });
      if (results.success === true) {
        for (const artifact of results.outputs) {
          switch (artifact.kind) {
            case 'entry-point': {
              const text = await artifact.text();
              file.setText(text);
              for (const [, ...paths] of text.matchAll(/\n?\/\/ (src\/.*)\n?/g)) {
                for (const path of paths) {
                  if (file.src_path.equals(path) === false) {
                    builder.addDependency(builder.getFile(Path(path)), file);
                  }
                }
              }
              break;
            }
            // for any non-code imports. there's probably a more elegant
            // way to do this, but this is temporary
            // case 'asset':
            // case 'sourcemap':
            default: {
              const text = await artifact.text();
              await builder.platform.File.writeText(Path(builder.dir.out, artifact.path), text);
            }
          }
        }
      } else {
        this.channel.error(`File: ${file.src_path.raw}, Errors: [`);
        for (const log of results.logs) {
          this.channel.error(' ', log);
        }
        this.channel.error(']');
      }
    } catch (error) {
      this.channel.error(`File: ${file.src_path.raw}, Errors: [`);
      if (error instanceof AggregateError) {
        for (const e of error.errors) {
          this.channel.error(' ', e);
        }
      } else {
        this.channel.error(error);
      }
      this.channel.error(']');
    }
  }
}

async function getUserscriptHeader(file: ProjectFile) {
  const text = await file.getText();
  const start = text.match(/^\/\/.*?==UserScript==.*?$/dim);
  const end = text.match(/^\/\/.*?==\/UserScript==.*?$/dim);
  const header = text.slice(start?.indices?.[0][0] ?? 0, end?.indices?.[0][1] ?? 0);
  return `${header}\n`;
}
