import * as WavFileDecoder from "wav-file-decoder";
import * as Fs from "fs";

function main() {
   const args = process.argv.slice(2);
   if (args.length != 1) {
      throw new Error("Invalid number of command line parameters."); }
   const inputFileName = args[0];
   const fileData = Fs.readFileSync(inputFileName);
   const wavFileInfo = WavFileDecoder.getWavFileInfo(fileData);
   console.log(wavFileInfo); }

main();
