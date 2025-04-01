import { Path } from '../../src/lib/ericchase/Platform/FilePath.js';
import { Logger } from '../../src/lib/ericchase/Utility/Logger.js';
import { BuilderInternal, Step } from '../lib/Builder.js';
import { ts_tsx_js_jsx } from '../lib/processors/TypeScript-GenericBundler.js';

const logger = Logger(Step_GenerateLinks.name);

export function Step_GenerateLinks(): Step {
  return new CStep_GenerateLinks();
}

class CStep_GenerateLinks implements Step {
  channel = logger.newChannel();

  async onRun(builder: BuilderInternal): Promise<void> {
    this.channel.log('Generate Links');

    const atags: string[] = [];
    for (const file of builder.files) {
      if (builder.platform.Utility.globMatch(file.src_path.standard, `**/*{.user}${ts_tsx_js_jsx}`) === true) {
        atags.push(`<a href="./${file.out_path.basename}" target="_blank">${file.out_path.basename}</a>`);
      }
    }
    const index = builder.getFile(Path(builder.dir.src, 'index.html'));
    index.setText((await index.getText()).replace('<links-placeholder />', atags.join('\n    ')));
    await index.write();
  }
}
