module.exports = function () {
  var $ = document.querySelectorAll.bind(document)
  var body = document.body
  var overlays = $('.modal')
  var openTriggers = $('[data-toggle = modal]')
  var closeTriggers = $('[data-dismiss = modal]')
  var activeModal = null

  function _open(e) {
    e.preventDefault()

    var targetId = this.dataset.target
    var target = $(targetId)

    body.classList.add('no-scroll')
    target[0].classList.add('modal--visible')
    activeModal = target[0]
  }

  function _close() {
    body.classList.remove('no-scroll')
    activeModal.classList.remove('modal--visible')
  }

  function _overlayOnClick(e) {
    var target = e.target
    var isContent = target.closest('.modal__content')

    if (!isContent) {
      e.preventDefault()

      _close()
    }
  }

  function init() {
    for (var i = 0; i < openTriggers.length; i++) {
      openTriggers[i].addEventListener('click', _open)
    }

    for (var i = 0; i < closeTriggers.length; i++) {
      closeTriggers[i].addEventListener('click', _close)
    }

    for (var i = 0; i < overlays.length; i++) {
      overlays[i].addEventListener('click', _overlayOnClick)
    }
  }

  return {
    init: init
  }
}()
