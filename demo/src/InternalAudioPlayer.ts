import {nextTick} from "./Utils.js";

export default class InternalAudioPlayer extends EventTarget {

   private audioContext:           AudioContext;
   private activeAudioSourceNode?: AudioScheduledSourceNode;
   private initDone:               boolean;

   public constructor() {
      super();
      this.initDone = false; }

   private init() {
      if (this.initDone) {
         return; }
      this.audioContext = new AudioContext();
      this.initDone = true; }

   public async playAudioBuffer (buffer: AudioBuffer) {
      this.init();
      this.disposeActiveAudioSource();
      await this.resumeAudioContext();
      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.connect(this.audioContext.destination);
      sourceNode.addEventListener("ended", this.audioEndedEventHandler);
      sourceNode.start();
      this.activeAudioSourceNode = sourceNode;
      this.fireEvent("stateChange"); }

   public async playSamples (samples: ArrayLike<number>, sampleRate: number) {
      const buffer = new AudioBuffer({length: samples.length, sampleRate});
      const data = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
         data[i] = samples[i]; }
      await this.playAudioBuffer(buffer); }

   public isPlaying() : boolean {
      return !!this.activeAudioSourceNode; }

   public stop() {
      this.disposeActiveAudioSource(); }

   private audioEndedEventHandler = () => {
      this.disposeActiveAudioSource(); };

   private disposeActiveAudioSource() {
      if (!this.activeAudioSourceNode) {
         return; }
      const sourceNode = this.activeAudioSourceNode;
      this.activeAudioSourceNode = undefined;
      sourceNode.stop();
      sourceNode.disconnect();
      sourceNode.removeEventListener("ended", this.audioEndedEventHandler);
      this.fireEvent("stateChange"); }

   private async resumeAudioContext() {
      if (this.audioContext.state == "suspended") {
         await this.audioContext.resume(); }}

   private fireEvent (type: string) {
      const event = new CustomEvent(type);
      nextTick(() => {                                     // call event listeners asynchronously
         this.dispatchEvent(event); }); }

   }
