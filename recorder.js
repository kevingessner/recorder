import { get, set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

export default function init(elBtnRecord, elBtnPlay) {
  const state = {
    hasRecording: false,
  };
  Object.seal(state);
  function updateUIFromState(_) {
    elBtnPlay.disabled = elBtnPlay.ariaDisabled = !state.hasRecording;
  }

  async function saveRecordingData(blob) {
    const audioCtx = new AudioContext();
    const buffer = await blob.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(buffer);

    // Play back the recording immediately.
    const source = audioCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(audioCtx.destination);
    source.start();
  }

  function recordStream(stream) {
    const recorder = new MediaRecorder(stream);
    recorder.addEventListener('dataavailable', (event) => {
      updateUIFromState(state.hasRecording = true);
      saveRecordingData(event.data);
    });
    setTimeout(() => recorder.stop(), 2000);
    recorder.start();
  }

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => recordStream(stream))
      .catch((err) => { console.log(`The following gUM error occured: ${err}`); });
  }

  elBtnRecord.addEventListener('click', (event) => startRecording());

  updateUIFromState();
}
