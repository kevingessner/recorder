import createHoldButton from './hold-button.js';

function disableButton(elBtn, flag) {
  elBtn.ariaDisabled = flag;
  elBtn.disabled = flag;
  if (flag) {
    elBtn.setAttribute("disabled", "disabled");
  } else {
    elBtn.removeAttribute("disabled");
  }
}

import { Recorder, Events as recorderEvents } from './recorder.js';
export default async function init(elBtnRecord, elBtnPlay, elBtnPreview, elErrorOutput) {
  const recorder = new Recorder;

  recorder.onupdate = (evt) => {
    disableButton(elBtnPlay, !evt.data.hasRecording || evt.data.isRecording);
    disableButton(elBtnPreview, !evt.data.hasRecording || evt.data.isRecording);
    elBtnPlay.classList.toggle("new-recording", evt.data.hasNewRecording);
    elBtnPlay.value = evt.data.isRecording ? "Recording..." : "Play";
  };
  recorder.onerror = (evt) => {
    const err = evt.error;
    elErrorOutput.innerHTML = err + "<br>" + JSON.stringify(err);
    if (console && console.log) throw err;
  };

  elBtnPlay.addEventListener('click', () => recorder.playAndMarkListened());
  elBtnPreview.addEventListener('click', () => recorder.play());
  createHoldButton(elBtnRecord,document.querySelector('#hold-to-record'),
    () => recorder.startRecording(),
    () => recorder.stopRecording());
}


