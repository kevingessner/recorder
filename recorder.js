import { get as getFromStorage, set as setToStorage, getMany as getManyFromStorage } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

const StorageRecordingKey = 'recorder.recording';
const StorageListenedKey = 'recorder.listened';

export const Events = {
  Error: 'error',
  Update: 'update',
};
Object.freeze(Events);

function promisify(obj) {
  return new Promise(function(resolve, reject) {
    obj.onload =
      obj.onerror = function(evt) {
        obj.onload =
          obj.onerror = null

        evt.type === 'load'
          ? resolve(obj.result || obj)
          : reject(new Error('Failed to read the blob/file'))
      }
  });
}

export class Recorder extends EventTarget {
  #recorder = null;

  constructor() {
    super();
    this.#dispatchUpdate();
  }

  #dispatchError(e) {
    this.dispatchEvent(new ErrorEvent(Events.Error, {message: e, error: e}));
  }

  #dispatchUpdate() {
    getManyFromStorage([StorageRecordingKey, StorageListenedKey])
      .then(([blob, listened]) => {
        this.dispatchEvent(new MessageEvent(Events.Update, {
          data: {
            hasRecording: blob != null,
            hasNewRecording: blob != null && !listened,
            isRecording: this.#recorder != null,
          },
        }));
      })
      .catch(this.#dispatchError.bind(this));
  }

  #markListened() {
    setToStorage(StorageListenedKey, true);
    this.#dispatchUpdate();
  }

  async #saveRecordingData(blob) {
    setToStorage(StorageRecordingKey, blob);
    setToStorage(StorageListenedKey, false);
    await this.play();
    this.#dispatchUpdate();
  }

  #recordStream(stream) {
    this.#recorder = new MediaRecorder(stream);
    // 'start' event doesn't work in iOS 12 afaict, but 'stop' and 'dataavailable' do
    this.#recorder.addEventListener('dataavailable', (event) => this.#saveRecordingData(event.data).catch(this.#dispatchError.bind(this)));
    setTimeout(() => this.stopRecording(), 2000);
    this.#dispatchUpdate();
    this.#recorder.start();
  }

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => this.#recordStream(stream))
      .catch(this.#dispatchError.bind(this));
  }

  stopRecording() {
    this.#recorder.stop();
    this.#recorder = null;
    this.#dispatchUpdate();
  }

  async playAndMarkListened() {
    await this.play();
    this.#markListened();
  }

  async play() {
    // Can't play on a new page load on iOS 12 without requesting audio access first
    // (even though this should just be for the mic).
    await navigator.mediaDevices.getUserMedia({ audio: true });
    // Support old iOS
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const blob = await getFromStorage(StorageRecordingKey);
    // This would be simpler in a more modern browser:
    //
    // const buffer = await blob.arrayBuffer();
    // const decoded = await audioCtx.decodeAudioData(buffer);
    // ... use decoded ...
    //
    // But the old iOS 12 I'm targetting doesn't have either of those.
    const fr = new FileReader();
    fr.readAsArrayBuffer(blob);
    const buffer = await promisify(fr);
    audioCtx.decodeAudioData(buffer, function decodeAudioDataHandler(decoded) {
      // Play back the recording immediately.
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(audioCtx.destination);
      source.start();
    });
  }
}
