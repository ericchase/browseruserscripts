import { Builder } from './lib/Builder.js';
import { Processor_BasicWriter } from './lib/processors/FS-BasicWriter.js';
import { Processor_HTML_CustomComponent } from './lib/processors/HTML-CustomComponent.js';
import { Processor_HTML_ImportConverter } from './lib/processors/HTML-ImportConverter.js';
import { ts_tsx_js_jsx } from './lib/processors/TypeScript-GenericBundler.js';
import { Step_Bun_Run } from './lib/steps/Bun-Run.js';
import { Step_DevServer } from './lib/steps/Dev-Server.js';
import { Step_CleanDirectory } from './lib/steps/FS-CleanDirectory.js';
import { Step_Format } from './lib/steps/FS-Format.js';
import { Processor_UserscriptBundler } from './Processor-UserscriptBundler.js';
import { Step_GenerateLinks } from './Step-GenerateLinks.js';

const builder = new Builder(Bun.argv[2] === '--watch' ? 'watch' : 'build');

builder.setStartUpSteps(
  Step_Bun_Run({ cmd: ['bun', 'install'] }, 'quiet'),
  Step_CleanDirectory(builder.dir.out),
  Step_Format('quiet'), //
);

builder.setBeforeProcessingSteps();

builder.setProcessorModules(
  Processor_HTML_CustomComponent(),
  Processor_HTML_ImportConverter(),
  Processor_UserscriptBundler({ sourcemap: 'none' }),
  // skip files in @todo folder
  Processor_BasicWriter([`**/*{.user}${ts_tsx_js_jsx}`, '**/index.html'], ['**/@todo/**/*']), //
);

builder.setAfterProcessingSteps(
  Step_GenerateLinks(),
  Step_DevServer(), //
);

builder.setCleanUpSteps();

await builder.start();
