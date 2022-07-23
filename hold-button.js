// Implements a button that calls 'onclick' only after it has been held down for more than 1s, and calls 'onrelease'
// iff onclick was called. Adds .visible to elWaiting during that 1s.
export default function createHoldButton(elBtn, elWaiting, onclick, onrelease) {
  var handler = function(event) {
    event.target.value = event.type;
  }
  let timeout;
  function ondown() {
    elWaiting.classList.add('visible');
    timeout = setTimeout(() => {
      // Time has elapsed. Hide the progress and kick off the actual action.
      timeout = null;
      onclick();
      elWaiting.classList.remove('visible');
    }, 1000);
  }
  function onup() {
    if (timeout) {
      // Released before time elapsed.  Reset.
      clearTimeout(timeout);
      timeout = null;
      elWaiting.classList.remove('visible');
    } else {
      // Released after time elapsed and 'onclick' was called.
      onrelease();
    }
  }
  elBtn.addEventListener('touchstart', ondown);
  elBtn.addEventListener('touchend', onup);
  elBtn.addEventListener('mousedown', ondown);
  elBtn.addEventListener('mouseup', onup);
};
