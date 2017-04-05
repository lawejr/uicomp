module.exports = (function () {
  var $ = document.querySelectorAll.bind(document)
  var body = document.body
  var overlays = $('.uc-modal')
  var openTriggers = $('[data-toggle = uc-modal]')
  var closeTriggers = $('[data-dismiss = uc-modal]')
  var activeModal = null

  function _open (e) {
    e.preventDefault()

    var targetId = this.dataset.target
    var target = $(targetId)

    body.classList.add('uc-no-scroll')
    target[0].classList.add('uc-modal--visible')
    activeModal = target[0]
  }

  function _close () {
    body.classList.remove('uc-no-scroll')
    activeModal.classList.remove('uc-modal--visible')
  }

  function _overlayOnClick (e) {
    var target = e.target
    var isContent = target.closest('.uc-modal__content')

    if (!isContent) {
      e.preventDefault()

      _close()
    }
  }

  function init () {
    for (let i = openTriggers.length; i--;) {
      openTriggers[i].addEventListener('click', _open)
    }

    for (let i = closeTriggers.length; i--;) {
      closeTriggers[i].addEventListener('click', _close)
    }

    for (let i = overlays.length; i--;) {
      overlays[i].addEventListener('click', _overlayOnClick)
    }
  }

  return {
    init: init
  }
})()
