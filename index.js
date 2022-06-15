(function(window) {
    'use strict';

    var state = {
        hasRecording: false,
    };
    Object.seal(state);
    function updateUIFromState(_) {
        let play = document.querySelector('#btn-play');
        play.disabled = play.ariaDisabled = !state.hasRecording;
    };

    async function handleRecordingData(blob) {
        var audioCtx = new AudioContext();
        var buffer = await blob.arrayBuffer();
        var decoded = await audioCtx.decodeAudioData(buffer);

        // Play back the recording immediately.
        var source = audioCtx.createBufferSource();
        source.buffer = decoded;
        source.connect(audioCtx.destination);
        source.start();
    };

    function recordStream(stream) {
        var recorder = new MediaRecorder(stream);
        recorder.addEventListener('dataavailable', event => {
            updateUIFromState(state.hasRecording = true);
            handleRecordingData(event.data);
        });
        setTimeout(() => recorder.stop(), 2000);
        recorder.start();
    };

    function startRecording() {
        navigator.mediaDevices.getUserMedia({audio: true})
            .then(stream => recordStream(stream))
            .catch( function(err) { console.log('The following gUM error occured: ' + err);});
    };

    document.querySelector('#btn-record').addEventListener('click', event => startRecording());

    updateUIFromState();
})(window);
