import { get as getFromStorage, set as setToStorage } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

export default function init(elBtnRecord, elBtnPlay) {
  const StorageKey = 'recorder.recording';

  const state = {
    hasRecording: false,
  };
  Object.seal(state);
  function updateUIFromState() {
    elBtnPlay.disabled = elBtnPlay.ariaDisabled = !state.hasRecording;
  }

  function logError(err) {
    console.log(err);
    // TODO display to the user
  }

  function handleErrors(fn) {
    return function withErrorHandling() {
      try {
        const res = fn(...arguments);
        if (res && res.catch) {
          res.catch(logError);
        }
        return res;
      } catch (e) {
        logError(e);
      }
    };
  }

  async function playFromStorage() {
    const audioCtx = new AudioContext();
    const blob = await getFromStorage(StorageKey);
    const buffer = await blob.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(buffer);

    // Play back the recording immediately.
    const source = audioCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(audioCtx.destination);
    source.start();
  }

  async function saveRecordingData(blob) {
    setToStorage(StorageKey, blob);
    updateUIFromState(state.hasRecording = true);
    await playFromStorage();
  }

  function recordStream(stream) {
    const recorder = new MediaRecorder(stream);
    recorder.addEventListener('dataavailable', handleErrors((event) => saveRecordingData(event.data)));
    setTimeout(() => recorder.stop(), 2000);
    recorder.start();
  }

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => recordStream(stream))
      .catch(logError);
  }

  elBtnRecord.addEventListener('click', handleErrors((event) => startRecording()));
  elBtnPlay.addEventListener('click', handleErrors((event) => playFromStorage()));

  updateUIFromState();
}
