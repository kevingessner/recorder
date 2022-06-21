export default function createHoldButton(elBtn) {
  var handler = function(event) {
    event.target.value = event.type;
  }
  elBtn.addEventListener('touchstart', handler);
  elBtn.addEventListener('touchend', handler);
  elBtn.addEventListener('click', handler);
};
