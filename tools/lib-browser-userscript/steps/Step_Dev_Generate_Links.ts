import { Async_BunPlatform_File_Write_Text } from '../../../src/lib/ericchase/BunPlatform_File_Write_Text.js';
import { Async_BunPlatform_Glob_Scan_Generator } from '../../../src/lib/ericchase/BunPlatform_Glob_Scan_Generator.js';
import { NODE_PATH } from '../../../src/lib/ericchase/NodePlatform.js';
import { Builder } from '../../core/Builder.js';
import { Logger } from '../../core/Logger.js';
import { PATTERN } from '../../core/processor/Processor_TypeScript_Generic_Bundler.js';

export function Step_Dev_Generate_Links(): Builder.Step {
  return new Class();
}
class Class implements Builder.Step {
  StepName = Step_Dev_Generate_Links.name;
  channel = Logger(this.StepName).newChannel();

  constructor() {}
  async onStartUp(): Promise<void> {}
  async onRun(): Promise<void> {
    this.channel.log('Generate Links');
    const atags: string[] = [];
    for await (const entry of Async_BunPlatform_Glob_Scan_Generator(Builder.Dir.Out, `**/*{.user}${PATTERN.TS_TSX_JS_JSX}`)) {
      atags.push(`<a href="./${entry}" target="_blank">${entry}</a>`);
    }
    const file__index = Builder.File.Get(NODE_PATH.join(Builder.Dir.Src, 'index.html'));
    if (file__index !== undefined) {
      file__index.iswritable = true;
      // file.setText only works inside processors, so we need to directly write the file here
      await Async_BunPlatform_File_Write_Text(file__index.out_path, (await file__index.getText()).replace('<links-placeholder />', atags.join('\n    ')));
    }
  }
  async onCleanUp(): Promise<void> {}
}
