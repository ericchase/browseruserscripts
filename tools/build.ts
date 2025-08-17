import { BunPlatform_Args_Has } from '../src/lib/ericchase/BunPlatform_Args_Has.js';
import { Step_Dev_Format } from './core-dev/step/Step_Dev_Format.js';
import { Step_Dev_Project_Update_Config } from './core-dev/step/Step_Dev_Project_Update_Config.js';
import { Processor_HTML_Custom_Component_Processor } from './core-web/processor/Processor_HTML_Custom_Component_Processor.js';
import { DEV_SERVER_HOST, Step_Run_Dev_Server } from './core-web/step/Step_Run_Dev_Server.js';
import { Builder } from './core/Builder.js';
import { PATTERN, Processor_TypeScript_Generic_Bundler } from './core/processor/Processor_TypeScript_Generic_Bundler.js';
import { Step_Bun_Run } from './core/step/Step_Bun_Run.js';
import { Step_FS_Clean_Directory } from './core/step/Step_FS_Clean_Directory.js';
import { Processor_TypeScript_UserScript_Bundler } from './lib-browser-userscript/processors/Processor_TypeScript_UserScript_Bundler.js';
import { Step_Dev_Generate_Links } from './lib-browser-userscript/steps/Step_Dev_Generate_Links.js';

if (BunPlatform_Args_Has('--dev')) {
  Builder.SetMode(Builder.MODE.DEV);
}
Builder.SetVerbosity(Builder.VERBOSITY._1_LOG);

Builder.SetStartUpSteps(
  Step_Dev_Project_Update_Config({ project_path: '.' }),
  Step_Bun_Run({ cmd: ['bun', 'update', '--latest'], showlogs: false }),
  Step_Bun_Run({ cmd: ['bun', 'install'], showlogs: false }),
  Step_FS_Clean_Directory(Builder.Dir.Out),
  Step_Dev_Format({ showlogs: false }),
  //
);

Builder.SetProcessorModules(
  Processor_HTML_Custom_Component_Processor(),
  Processor_TypeScript_Generic_Bundler({ define: () => ({ 'process.env.SERVERHOST': DEV_SERVER_HOST }) }, { bundler_mode: 'iife' }),
  Processor_TypeScript_UserScript_Bundler({ define: () => ({ 'process.env.SERVERHOST': DEV_SERVER_HOST }) }),
  //
);

Builder.SetAfterProcessingSteps(
  Step_Dev_Generate_Links({ dirpath: Builder.Dir.Out, pattern: `**/*{.user}${PATTERN.JS_JSX_TS_TSX}` }),
  Step_Run_Dev_Server(),
  //
);

await Builder.Start();
