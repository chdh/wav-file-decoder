import {openFileOpenDialog, catchError, setMsg} from "./Utils.js";
import InternalAudioPlayer from "./InternalAudioPlayer.js";
import * as WavFileDecoder from "wav-file-decoder";
import * as FunctionCurveViewer from "function-curve-viewer";

var audioPlayer:             InternalAudioPlayer;
var signalViewerWidget:      FunctionCurveViewer.Widget;
var signalValid:             boolean = false;
var signal:                  Float32Array;
var sampleRate:              number;

function loadSignalViewer() {
   const viewerFunction = FunctionCurveViewer.createViewerFunctionForArray(signal, {scalingFactor: sampleRate});
   const yRange = 1.2;
   const viewerState : Partial<FunctionCurveViewer.ViewerState> = {
      viewerFunction:  viewerFunction,
      xMin:            0,
      xMax:            signal.length / sampleRate,
      yMin:            -yRange,
      yMax:            yRange,
      gridEnabled:     true,
      primaryZoomMode: FunctionCurveViewer.ZoomMode.x,
      xAxisUnit:       "s",
      focusShield:     true };
   signalViewerWidget.setViewerState(viewerState); }

async function loadWavFile (file: File) {
   const fileData = await file.arrayBuffer();
   if (!WavFileDecoder.isWavFile(fileData)) {
      throw new Error("Not a valid and supported WAV file."); }
   const d = WavFileDecoder.decodeWavFile(fileData);
   setMsg(`type=${d.wavFileTypeName}, sampleRate=${d.sampleRate}, channels=${d.channelData.length}, samples=${d.channelData[0].length}`);
   signal = d.channelData[0];                              // (only the first channel is used)
   sampleRate = d.sampleRate;
   signalValid = true;
   loadSignalViewer();
   refreshGui(); }

function loadButton_click() {
   audioPlayer.stop();
   signalValid = false;
   setMsg("");
   refreshGui();
   openFileOpenDialog((file: File) => catchError(loadWavFile, file)); }

async function playButton_click() {
   if (audioPlayer.isPlaying()) {
      audioPlayer.stop(); }
    else {
      await audioPlayer.playSamples(signal, sampleRate); }}

function refreshGui() {
   signalViewerWidget.disabled = !signalValid;
   const playButton = <HTMLButtonElement>document.getElementById("playButton");
   playButton.disabled = !signalValid;
   playButton.textContent = audioPlayer.isPlaying() ? "Stop" : "Play"; }

function startup() {
   audioPlayer = new InternalAudioPlayer();
   audioPlayer.addEventListener("stateChange", refreshGui);
   const signalViewerCanvas = <HTMLCanvasElement>document.getElementById("signalViewerCanvas")!;
   signalViewerWidget = new FunctionCurveViewer.Widget(signalViewerCanvas);
   document.getElementById("loadButton")!.addEventListener("click", () => catchError(loadButton_click));
   document.getElementById("playButton")!.addEventListener("click", () => catchError(playButton_click));
   refreshGui(); }

document.addEventListener("DOMContentLoaded", startup);
